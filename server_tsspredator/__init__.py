from asyncio.subprocess import PIPE
from shutil import make_archive, rmtree
from flask import Flask, request, send_file, send_from_directory, jsonify
from werkzeug.utils import secure_filename

import json
import tempfile
import subprocess
import os
# import shutil
import tempfile

import server_tsspredator.parameter as parameter
import server_tsspredator.server_handle_files as sf
# from celery import Celery, Task, shared_task


job_data = {}

# def celery_init_app(app: Flask) -> Celery:
#     class FlaskTask(Task):
#         def __call__(self, *args: object, **kwargs: object) -> object:
#             with app.app_context():
#                 return self.run(*args, **kwargs)

#     celery_app = Celery(app.name, task_cls=FlaskTask)
#     celery_app.config_from_object(app.config["CELERY"])
#     celery_app.set_default()
#     app.extensions["celery"] = celery_app
    # return celery_app

app = Flask(__name__, static_folder='../build', static_url_path='/')
app.config.from_mapping(
    # CELERY=dict(
    #     broker_url="redis://localhost",
    #     result_backend="redis://localhost",
    # ),
)
# celery_app = celery_init_app(app)

# @shared_task(ignore_result=False)
# def add_together(a: int, b: int) -> int:
#     return a + b
import uuid

def generate_unique_id():
    return str(uuid.uuid4())
# @shared_task(ignore_result=False, track_started=True)
def helperAsyncPredator(jsonString, newResultDir, workingDir, annotationDir):
    '''call jar file for TSS prediction and zip files'''
    try:
        # Execute JAR file with subprocess.run (this is blocking)
        serverLocation = os.getcwd()
        # join server Location to find TSSpredator
        tsspredatorLocation = os.path.join(serverLocation, 'TSSpredator.jar')
        unique_id = generate_unique_id()
        result = subprocess.Popen(['java', '-jar',tsspredatorLocation, jsonString], 
                                stdout=subprocess.PIPE, 
                                stderr=subprocess.PIPE, 
                                text=True,  # Ensures stdout and stderr are strings
                                # timeout=timeout_s
                                # cwd=workingDir
                                )
        job_data[unique_id] = {
        'process': result,
        'status': 'running', 
        "folders": 
            {
                "workingDir": workingDir,
                "annotationDir": annotationDir,
                "newResultDir": newResultDir
            }
    }

       
        return {'id': unique_id}

    except subprocess.TimeoutExpired:
        return {'result': 'Timeout'}

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
    result = helperAsyncPredator(jsonString, resultDir, tmpdir, annotationDir)
    print(result)
    return {'id': result["id"]}


@app.route('/')
def index():
    return app.send_static_file('index.html')

@app.route('/api/checkStatus/<task_id>', methods=['POST', 'GET'])
def task_status(task_id):
    task = job_data.get(task_id, None)

    if task is None:
        return {'status': 'Job not found'}, 404
    
    # Check if the subprocess is still running
    if task['process'].poll() is None:
        return {'job_id': task_id, 'status': 'Running'}
    else:
        if "result" not in task:  # If the result hasn't been retrieved yet
            out, err = task['process'].communicate()
            task['out'] = out 
            task['err'] = err
            task['status'] = 'Completed'
         # If no error, proceed to zip files
        # if task['err'] == '':
        newResultDir = task['folders']['newResultDir']
        tmpdirResult = tempfile.mkdtemp(prefix='tmpPredZippedResult')
        make_archive(os.path.join(tmpdirResult,'result'), 'zip', newResultDir)
        filePath = os.path.basename(tmpdirResult)
        for key in task["folders"]:
            fd = task["folders"][key]
            if os.path.exists(fd) and key != "newResultDir":
                rmtree(fd)
                # pass
        returnValue = {'job_id': task_id, 'status': task['status'], 'result': {"fileout": filePath, "out": task['out'], "err": task['err']}}
        return returnValue
     # # Check if there was an error in stderr or if returncode isn't 0 (success)
        # if result.returncode != 0 or result.stderr:
        #     return {'result': "Error", "details": result.stderr}

       
    # if task.state == 'PENDING':
    #     # job did not start yet
    #     response = {
    #         'state': task.state,
    #         'status': 'Pending...'
    #     }
    # elif task.state != 'FAILURE':
    #     response = {
    #         'state': task.state,
    #         'status': task.info.get('status', '')
    #     }
    #     if 'result' in task.info:
    #         response['result'] = task.info['result']
    # else:
    #     # something went wrong in the background job
    #     response = {
    #         'state': task.state,
    #         'status': str(task.info),  # this is the exception raised
    #     }
    # return response


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


@app.route('/api/testAsync/', methods=['POST', 'GET'])
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
    print(result)
    return jsonify({'result': 'success', "id": result['id']})

@app.route('/api/input/', methods=['POST', 'GET'])
def getInput():
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

    # create temporary directory, save files and save filename in genome/replicate object
    with tempfile.TemporaryDirectory() as tmpdir: 

        newTmpDir = tmpdir.replace('\\', '/')

        with tempfile.TemporaryDirectory() as annotationDir:

            newAnnotationDir = annotationDir.replace('\\', '/')
 
            genomes, replicates = sf.save_files(newTmpDir, newAnnotationDir, genomes, replicates, genomeFasta, genomeAnnotation, enrichedForward, enrichedReverse, normalForward, normalReverse, replicateNum)
            alignmentFile = request.files.get('alignmentfile')
            if alignmentFile:
                # save alignment file
                alignmentFilename = f"{newTmpDir}/{secure_filename(alignmentFile.filename)}"
                alignmentFile.save(alignmentFilename)
            else:
                alignmentFilename = ''
                print('No alignment file')
           
            # save files from tss prediciton in this directory
            with tempfile.TemporaryDirectory() as resultDir:

                newResultDir = resultDir.replace('\\', '/')

                # create json string for jar
                jsonString = sf.create_json_for_jar(genomes, replicates, replicateNum, alignmentFilename, projectName, parameters, rnaGraph, newResultDir)

                # call jar file for TSS prediction
                # timeout after 10 minutes
                timeout_s = 600 
                try:
                    p = subprocess.run(['java', '-jar', 'TSSpredator.jar', jsonString], stderr=PIPE, timeout=timeout_s)
                
                    # zip files
                    tmpdirResult = tempfile.mkdtemp()
                    newTmpDirResult = tmpdirResult.replace('\\', '/')
                    make_archive(newTmpDirResult+'/result', 'zip', newResultDir)                   
                    
                    # return tmp directory name to zip-directory or error
                    if(len(p.stderr) == 0):
                        filePath = newTmpDirResult.split('/')[-1]
                        return {'result': 'success', 'filePath': filePath}
                    else: 
                        return {'result': (p.stderr).decode()} 
                except subprocess.TimeoutExpired:
                    return {'result': 'Timeout'}                     
        
 
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