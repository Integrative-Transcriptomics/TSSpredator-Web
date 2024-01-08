from asyncio.subprocess import PIPE
from shutil import make_archive, rmtree
from time import time
from flask import Flask, request, send_file, send_from_directory, jsonify
from werkzeug.utils import secure_filename
from celery.exceptions import Ignore
from celery.utils.log import get_task_logger



import json
import tempfile
import subprocess
import os
import glob


import server_tsspredator.parameter as parameter
import server_tsspredator.server_handle_files as sf
from celery import Celery, Task, shared_task


def celery_init_app(app: Flask) -> Celery:
    class FlaskTask(Task):
        def __call__(self, *args: object, **kwargs: object) -> object:
            with app.app_context():
                return self.run(*args, **kwargs)

    celery_app = Celery(app.name, task_cls=FlaskTask)
    celery_app.config_from_object(app.config["CELERY"])
    celery_app.set_default()
    app.extensions["celery"] = celery_app
    return celery_app

app = Flask(__name__, static_folder='../build', static_url_path='/')
app.config.from_mapping(
    CELERY=dict(
        broker_url="redis://localhost",
        result_backend="redis://localhost",
    ),
)
celery_app = celery_init_app(app)
logger = get_task_logger(__name__)

@celery_app.on_after_configure.connect
def setup_periodic_tasks(sender, **kwargs):
    # Calls delete_temp_files('specific_prefix_') every 7 days.
    sender.add_periodic_task(60*24*7*60.0, delete_temp_files.s('tmpPred'), name='clear tmp every hour')

@celery_app.task
def delete_temp_files(prefix):
    directory = tempfile.gettempdir()  # The directory to search in
    for file_path in glob.glob(os.path.join(directory, f"{prefix}*")):
        # check whether the file is older than 7 days
        if os.stat(file_path).st_mtime < (time() - 60*60*24*7):
            try:
                rmtree(file_path)
                print(f"Removed {file_path}")
            except Exception as e:
                print(f"Error while deleting file {file_path}: {str(e)}")
        else:
            print(f"Skipping {file_path}")


@shared_task(ignore_result=False, track_started=True, bind=True, name='helperAsyncPredator')
def helperAsyncPredator(self, *args ):
    '''call jar file for TSS prediction and zip files'''
    [jsonString, resultDir, inputDir, annotationDir, projectName] = args
    try:
        # Give it a new state 
        self.update_state(state='RUNNING', meta={'projectName': projectName})
        # Execute JAR file with subprocess.run (this is blocking)
        serverLocation = os.getcwd()
        # join server Location to find TSSpredator
        tsspredatorLocation = os.path.join(serverLocation, 'TSSpredator.jar')
        # Run JAR file
        result = subprocess.run(['java', '-jar',tsspredatorLocation, jsonString], 
                                stdout=subprocess.PIPE, 
                                stderr=subprocess.PIPE, 
                                text=True,  # Ensures stdout and stderr are strings
                            )
        # If stderr is not empty, something went wrong
        if len(result.stderr) > 0:
            raise subprocess.CalledProcessError(result.returncode, result.args, stderr=result.stderr, output=result.stdout)
        tmpdirResult = tempfile.mkdtemp(prefix='tmpPredZippedResult')
        make_archive(os.path.join(tmpdirResult,'result'), 'zip', resultDir)
        filePath = os.path.basename(tmpdirResult)
        return {"filePath":filePath, "stderr": result.stderr, "stdout": result.stdout, "inputDir": inputDir, "annotationDir": annotationDir, "tempResultsDir": resultDir, "projectName": projectName}
    except Exception as e:
        self.update_state(state="INTERNAL_ERROR", 
                          meta={ 'stderr': e.stderr, 
                                'stdout': e.stdout, 
                                'inputDir': inputDir, 
                                'annotationDir': annotationDir, 
                                'tempResultsDir': resultDir, 
                                'projectName': projectName
                                })
        raise Ignore()
    
def asyncPredator(alignmentFile, enrichedForward, enrichedReverse, normalForward, normalReverse, genomeFasta, genomeAnnotation, projectName, parameters, rnaGraph, genomes, replicates, replicateNum): 
     # create temporary directory, save files and save filename in genome/replicate object
    tmpdir = tempfile.mkdtemp(prefix='tmpPredInputFolder')

    newTmpDir = tmpdir.replace('\\', '/')

    annotationDir = tempfile.mkdtemp(prefix='tmpPredAnnotation')

    newAnnotationDir = annotationDir.replace('\\', '/')

    genomes, replicates = sf.save_files(newTmpDir, newAnnotationDir, genomes, replicates, genomeFasta, genomeAnnotation, enrichedForward, enrichedReverse, normalForward, normalReverse, replicateNum)
    if alignmentFile:
        # save alignment file
        alignmentFilename = f"{newTmpDir}/{secure_filename(alignmentFile.filename)}"
        alignmentFile.save(alignmentFilename)
    else:
        alignmentFilename = ''
        print('No alignment file')
    
    # save files from tss prediciton in this directory
    resultDir = tempfile.mkdtemp(prefix='tmpPredResultFolder')

    newResultDir = resultDir.replace('\\', '/')
    # create json string for jar
    jsonString = sf.create_json_for_jar(genomes, replicates, replicateNum, alignmentFilename, projectName, parameters, rnaGraph, newResultDir)
    result = helperAsyncPredator.apply_async(
        args=[jsonString, resultDir, newTmpDir, newAnnotationDir, projectName],
        expires=1200,
        # kwargs=[{"headers":{'projectName': projectName}}]  # Adding customName as an extra header
    )    
    return {'id': str(result.id)}


@app.route('/')
def index():
    return app.send_static_file('index.html')

@app.route('/api/checkStatus/<task_id>', methods=['POST', 'GET'])
def task_status(task_id):
    task = helperAsyncPredator.AsyncResult(task_id)
   
    if task.state in ['PENDING', 'STARTED', "RUNNING"]:
        # job did not start yet
        response = {
            'state': task.state,
            "projectName": task.result['projectName']
        }
    elif task.state == 'SUCCESS':
        response = {
            'state': task.state,
            "projectName": task.result['projectName'],
        }
        if task.result:
            response['result'] = task.result
            remove_tmp_dirs([task.result[key] for key in ['inputDir', 'annotationDir', 'tempResultsDir'] if key in task.result])
    else:
        # something went wrong in the background job
        response = {
            'state': task.state,
            'result': {
                "stderr": task.info['stderr'], 
                "stdout": task.info['stdout']
                },
            "projectName": task.info['projectName']
                        
        }
        if task.state == 'INTERNAL_ERROR':
            remove_tmp_dirs([task.info[key] for key in ['inputDir', 'annotationDir', 'tempResultsDir'] if key in task.info])            
    return jsonify(response)

def remove_tmp_dirs(dirs) -> None   :
    for dir in dirs:
        if os.path.exists(dir):
            rmtree(dir)

@app.route('/result/<filePath>/')
def index_results(filePath):
    return app.send_static_file('index.html')

@app.route('/api/parameters/')
def parameters():
    ''' send parameter presets to frontend'''
    return  parameter.getParameters()

@app.route('/api/result/<filePath>/')
def getFiles(filePath):
    '''send result of TSS prediction to frontend'''
    completePath = tempfile.gettempdir().replace('\\', '/') + '/' + filePath + '/result.zip'
    return  send_file(completePath, mimetype='application/zip') 

@app.route('/api/input-test/', methods=['POST', 'GET'])
def getInputTest():
    return {'result': 'success', 'filePath': "filePath"}


@app.route('/api/runAsync/', methods=['POST', 'GET'])
def getInputAsync():
    '''get the input from the form and execute TSS prediction'''

    # get genome fasta files
    genomeFasta = request.files.to_dict(flat=False)['genomefasta']  

   # multiple genomannotation files per genome possible
    genomeAnnotation = []
    try:
        for x in range(len(genomeFasta)):
            genomeAnnotation.append(request.files.to_dict(flat=False)['genomeannotation'+str(x+1)])
    except:
        print("No genome Annotation file.")    
  
    # get all replicate files
    enrichedForward  = request.files.to_dict(flat=False)['enrichedforward']
    enrichedReverse = request.files.to_dict(flat=False)['enrichedreverse']
    normalForward = request.files.to_dict(flat=False)['normalforward']
    normalReverse = request.files.to_dict(flat=False)['normalreverse']    

    # get parameters
    projectName = request.form['projectname']
    parameters = json.loads(request.form['parameters'])
    rnaGraph = request.form['rnagraph']
    genomes = json.loads(request.form['genomes'])
    replicates = json.loads(request.form['replicates'])
    replicateNum = json.loads(request.form['replicateNum'])
    alignmentFile = request.files.get('alignmentfile')
    result = asyncPredator(alignmentFile, enrichedForward, enrichedReverse, normalForward, normalReverse, genomeFasta, genomeAnnotation, projectName, parameters, rnaGraph, genomes, replicates, replicateNum)
    return jsonify({'result': 'success', "id": result['id']})          
        
 
@app.route('/api/alignment/', methods=['POST', 'GET'])
def getAlignment():
    '''read alignment file when it was generated by mauve and send genome names/ids to frontend'''

    alignmentFile = request.files['alignmentFile']

    with tempfile.TemporaryDirectory() as tmpdir:

        newTmpDir = tmpdir.replace('\\', '/')

        # save alignment file
        alignmentFilename = newTmpDir + '/' + secure_filename(alignmentFile.filename)
        alignmentFile.save(alignmentFilename)

        # write JSON string 
        jsonString = '{"loadConfig": "false",' + '"saveConfig": "false", "loadAlignment": "true",' + '"alignmentFile": "' + alignmentFilename + '"}'

        # call jar file for to extract genome names & ids
        result = subprocess.run(['java', '-jar', 'TSSpredator.jar', jsonString], stdout=PIPE, stderr=PIPE)
        
        if(len(result.stderr) == 0):
            return {'result': 'success', 'data':json.loads((result.stdout).decode())}
        else:
            return {'result': 'error', 'data':json.loads((result.stderr).decode())}
        

@app.route('/api/loadConfig/', methods=['POST', 'GET'])
def loadConfig():
    '''load config file and send data back to frontend'''

    configFile = request.files['configFile']
    parameters = json.loads(request.form['parameters'])
    genomes = json.loads(request.form['genomes'])
    replicates = json.loads(request.form['replicates'])

    with tempfile.TemporaryDirectory() as tmpdir:

        newTmpDir = tmpdir.replace('\\', '/')

        # save config file
        configFilename = newTmpDir + '/' + secure_filename(configFile.filename)
        configFile.save(configFilename)

        # write JSON string 
        jsonString = '{"loadConfig": "true",' + '"saveConfig": "false", "loadAlignment": "false",' + '"configFile": "' + configFilename + '"}'
        
        # call jar file for to extract genome names & ids
        result = subprocess.run(['java', '-jar', 'TSSpredator.jar', jsonString], stdout=PIPE, stderr=PIPE)        
      
        if(len(result.stderr) == 0):
            config = json.loads((result.stdout).decode())
            parameters, genomes, replicates, alignmentFile, multiFasta = sf.handle_config_file(parameters, config, genomes, replicates)

            projectName = sf.get_value(config, 'projectName')

            rnaGraph = 'false'
            if int(sf.get_value(config, 'writeGraphs')) == 1:
                rnaGraph = "true"

            # use json.dumps() to keep order            
            return {'result': 'success', 'data': {'parameters': json.dumps(parameters), 'genomes': json.dumps(genomes), 
                    'replicates': json.dumps(replicates), 'projectName': projectName, 'rnaGraph': rnaGraph, 'alignmentFile': alignmentFile, 
                    'numReplicate': parameters['setup']['numberofreplicates']['value'], 'multiFasta': multiFasta}}
        else:
            return {'result': 'error', 'data': json.loads((result.stderr).decode())}
     

@app.route('/api/saveConfig/', methods=['POST', 'GET'])
def saveConfig():
    '''save input configuration as config file'''

    # get all inputs
    projectName = request.form['projectname']
    alignmentFile = ""
    try:
        alignmentFile = json.loads(request.form['alignmentFile'])
    except:
        print('no alignment file')
    parameters = json.loads(request.form['parameters'])
    rnaGraph = request.form['rnagraph']
    genomes = json.loads(request.form['genomes'])
    replicates = json.loads(request.form['replicates'])
    replicateNum = json.loads(request.form['replicateNum'])
    multiFasta = json.loads(request.form['multiFasta'])

    tmpdir = tempfile.mkdtemp()
    newTmpDir = tmpdir.replace('\\', '/')

    # save config file
    configFilename = newTmpDir + '/configFile.config'

    # write JSON string 
    jsonString = sf.create_json_for_jar(genomes, replicates, replicateNum, alignmentFile, projectName, parameters, rnaGraph, "", 'false', 'true', configFilename, multiFasta)
   

    # call jar file for to write config file
    subprocess.run(['java', '-jar', 'TSSpredator.jar', jsonString])

    return send_file(configFilename, as_attachment=True)

@app.route('/api/exampleData/<organism>/<type>/<filename>/')
def exampleData(organism, type,filename):
    '''send config file (json) or zip directory to load example data'''

    json_path = './exampleData/{}/{}_config.json'.format(organism, organism)
    files_path =  './exampleData/{}/Archive'.format(organism)

    if type == 'json':
        with open(json_path) as json_file:
            data = json.load(json_file)
            return {'result': json.dumps(data)}
                
    elif type == 'files':
        return send_from_directory(files_path, filename)

  

# if __name__ == "__main__":
#     app.run(debug=True)