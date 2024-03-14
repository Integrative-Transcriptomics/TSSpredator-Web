from asyncio.subprocess import PIPE
from shutil import make_archive, rmtree, unpack_archive
from time import time
import traceback
from flask import Flask, request, send_file, send_from_directory, jsonify, session
from werkzeug.utils import secure_filename
from celery.exceptions import Ignore
from celery.utils.log import get_task_logger
import collections

import json
import tempfile
import subprocess
import os
import glob
import pandas as pd


import server_tsspredator.parameter as parameter
import server_tsspredator.server_handle_files as sf
import server_tsspredator.server_visualization_processing as server_viz
from celery import Celery, Task, shared_task

tempfile.tempdir = os.getenv('TSSPREDATOR_TEMPDATA', tempfile.gettempdir())

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

app = Flask(__name__, static_folder='../dist', static_url_path='/')
app.secret_key = os.getenv('SECRET_KEY_TSSPREDATOR', "BAD_SECRET_KEY")


host_redis = os.getenv('TSSPREDATOR_REDIS_HOST', 'localhost')
port_redis = os.getenv('TSSPREDATOR_REDIS_PORT', 6379)
app.config.from_mapping(
    CELERY=dict(
        broker_url=f"redis://{host_redis}:{port_redis}"  ,
        result_backend=f"redis://{host_redis}:{port_redis}"  ,
    ),
)
celery_app = celery_init_app(app)
logger = get_task_logger(__name__)

@celery_app.on_after_configure.connect
def setup_periodic_tasks(sender, **kwargs):
    # Calls delete_temp_files('specific_prefix_') every day.
    # With this, it will delete all files with the prefix 'specific_prefix_' that are older than 7 days
    sender.add_periodic_task(24*7*60*60.0, delete_temp_files.s('tmpPred'), name='clear tmp every day')

@celery_app.task
def delete_temp_files(prefix):
    '''delete all files with the prefix 'prefix' that are older than 7 days'''
    print(f"Deleting files with prefix {prefix}")
    directory = tempfile.gettempdir()  # The directory to search in
    for file_path in glob.glob(os.path.join(directory, f"{prefix}*")):
        # check whether the file is older than 7 days
        if os.stat(file_path).st_mtime < (time() - 24*7*60*60.0):
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
    [request, inputDir, annotationDir] = args
    jsonObject = json.loads(request)
    jsonObject['rnaGraph'] = "true" if jsonObject['rnaGraph'] else "false"
    resultDir = tempfile.mkdtemp(prefix='tmpPredResultFolder').replace('\\', '/')

    try:
        projectName = jsonObject['projectName']
        # self.update_state(state='PENDING', meta={'projectName': projectName})
        jsonString = sf.processRequestJSON(jsonObject, resultDir, inputDir, annotationDir)
        # Execute JAR file with subprocess.run (this is blocking)
        self.update_state(state='RUNNING', meta={'projectName': projectName})
        serverLocation = os.getenv('TSSPREDATOR_SERVER_LOCATION', os.path.join(os.getcwd(), "server_tsspredator"))
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
        # remove temp dir from jsonString
        jsonString = jsonString.replace(annotationDir, "")
        jsonString = jsonString.replace(inputDir, "")
        jsonString = jsonString.replace(resultDir, "")
        # write json string into tmpdirResult
        with open(os.path.join(tmpdirResult, 'config.json'), 'w') as f:
            f.write(jsonString)
        # print files in resultDir
        print(f"Files in {resultDir}: {os.listdir(resultDir)}")
        self.update_state(state='PROCESSING_RESULTS', meta={'projectName': projectName})
        # Zip the results        
        make_archive(os.path.join(tmpdirResult,'result'), 'zip', resultDir)
        # Process results for visualization
        server_viz.process_results(resultDir, tmpdirResult)
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
    
@app.route('/api/startUpload/', methods=['GET'])
def startUpload():
    session["inputFiles"] = tempfile.mkdtemp(prefix='tmpPredInputFolder')
    session["annotationFiles"] = tempfile.mkdtemp(prefix='tmpPredAnnotation')
    return {'result': 'success'}

@app.route('/api/upload/', methods=['POST'])
def upload():
    '''upload files for TSS prediction'''
    if request.method == 'POST':
        try:
            # Validate file
            if 'file' not in request.files:
                print("No file part")
                return jsonify({'error': 'No file part'}), 400

            file = request.files['file']
            if file.filename == '':
                print("No selected file")
                return jsonify({'error': 'No selected file'}), 400

            fileType = request.form.get('fileType')
            fileCategory = request.form.get('fileCategory')

            if fileType not in ["input", "annotation"]: 
                print(f"Invalid file type: {fileType}")
                return jsonify({'error': 'Invalid file type'}), 400
            # Ensure the directory exists
            directory = session["inputFiles"] if fileType == "input" else session["annotationFiles"]
            if not os.path.exists(directory):
                os.makedirs(directory)
            # Save file
            fileName = secure_filename(file.filename)
            filePath = os.path.join(directory, fileName)
            file.save(filePath)
            return jsonify({'result': 'success', "fileName": fileName, "fileCategory": fileCategory})
        except Exception as e:
            print(f"Exception: {e}")
            traceback.print_exc()  # Print complete stack trace
            return jsonify({'error': 'An error occurred'}), 500
    else:
        return jsonify({'error': 'Invalid request method'}), 405
   

def asyncPredator(request_data): 
    '''call jar file for TSS prediction and zip files'''
    result = helperAsyncPredator.apply_async(
        args=[request_data, session["inputFiles"], session["annotationFiles"]],
        expires=1200,
    )    
    return {'id': str(result.id)}


@app.route('/')
def index():
    return app.send_static_file('index.html')

@app.errorhandler(404)
def not_found(e):
    return app.send_static_file('index.html')

@app.route('/result/<filePath>/')
def index_results(filePath):
    return app.send_static_file('index.html')

@app.route('/status/<id>/')
def index_status(id):
    return app.send_static_file('index.html')

@app.route('/api/checkStatus/<task_id>', methods=['POST', 'GET'])
def task_status(task_id):
    task = helperAsyncPredator.AsyncResult(task_id)
    if task.state == 'PENDING':
        resp = Flask.make_response(app, rv="ID not found")
        resp.status_code = 404
        resp.headers['Error'] = 'ID Not found'
        # if file not found, send error message
        return resp

    elif task.state in ['STARTED', "RUNNING", "PARSING DATA", "PROCESSING_RESULTS"]:
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



@app.route('/api/parameters/')
def parameters():
    ''' send parameter presets to frontend'''
    return  parameter.getParameters()

@app.route('/api/result/<filePath>/')
def getFiles(filePath):
    '''send result of TSS prediction to frontend'''
    # get path of zip file
    completePath = tempfile.gettempdir().replace('\\', '/') + '/' + filePath + '/result.zip'
    if os.path.exists(completePath):
        return  send_file(completePath, mimetype='application/zip')
    else:
        resp = Flask.make_response(app, rv="File not found")
        resp.status_code = 404
        resp.headers['Error'] = 'File Not found'
        # if file not found, send error message
        return resp
    
@app.route('/api/provideBigWig/<filePath>/<genome>/<strand>/<fileType>')
def returnBigWig(filePath, genome, strand, fileType): 
    completePath = os.path.join(tempfile.gettempdir().replace('\\', '/'), filePath, f"{genome}_super{fileType}{strand}.bw")
    return send_file(completePath, mimetype='text/plain')
       
@app.route('/api/provideFasta/<filePath>/<genome>/')
def returnFasta(filePath, genome): 
    completePath = os.path.join(tempfile.gettempdir().replace('\\', '/'), filePath, f'{genome}_superGenome.tsv')
    print(completePath)
    return send_file(completePath, mimetype='text/plain')

@app.route('/api/TSSViewer/<filePath>/')
def getTSSViewer(filePath):
    '''send result of TSS prediction to frontend'''
    # get path of zip file
    completePath = tempfile.gettempdir().replace('\\', '/') + '/' + filePath + '/aggregated_data.json'
    if os.path.exists(completePath):
        try:
            with open(completePath) as f:
                data = json.load(f)
                return jsonify(data)
            
        except Exception as e:
            print(e)
            traceback.print_exc() 
            resp = Flask.make_response(app, rv="File not found")
            resp.status_code = 404
            resp.headers['Error'] = 'File Not found'
            # if file not found, send error message
            return resp
    else:
        resp = Flask.make_response(app, rv="File not found")
        resp.status_code = 404
        resp.headers['Error'] = 'File Not found'
        # if file not found, send error message
        return resp


@app.route('/api/input-test/', methods=['POST', 'GET'])
def getInputTest():
    return {'result': 'success', 'filePath': "filePath"}


@app.route('/api/runAsync/', methods=['POST', 'GET'])
def getInputAsync():
    '''get the input from the form and execute TSS prediction'''
    # save start time
    dataSet = request.form['data']
    result = asyncPredator(dataSet)
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
        # write JSON string 
        jsonString = '{"loadConfig": "false",' + '"saveConfig": "false", "loadAlignment": "true",' + '"alignmentFile": "' + alignmentFilename + '"}'
        serverLocation = os.getenv('TSSPREDATOR_SERVER_LOCATION', os.getcwd())
        # join server Location to find TSSpredator
        tsspredatorLocation = os.path.join(serverLocation, 'TSSpredator.jar')

        # call jar file for to extract genome names & ids
        result = subprocess.run(['java', '-jar', tsspredatorLocation, jsonString], stdout=PIPE, stderr=PIPE)
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
    print(parameters)
    print(genomes)
    with tempfile.TemporaryDirectory() as tmpdir:

        newTmpDir = tmpdir.replace('\\', '/')

        # save config file
        configFilename = newTmpDir + '/' + secure_filename(configFile.filename)
        configFile.save(configFilename)
        print(configFilename)

        # write JSON string 
        jsonString = '{"loadConfig": "true",' + '"saveConfig": "false", "loadAlignment": "false",' + '"configFile": "' + configFilename + '"}'
        
        serverLocation = os.getenv('TSSPREDATOR_SERVER_LOCATION', os.getcwd())
        # join server Location to find TSSpredator
        tsspredatorLocation = os.path.join(serverLocation, 'TSSpredator.jar')
        # call jar file for to extract genome names & ids
        result = subprocess.run(['java', '-jar', tsspredatorLocation, jsonString], stdout=PIPE, stderr=PIPE)        
        print(result.stderr)
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
    serverLocation = os.getenv('TSSPREDATOR_SERVER_LOCATION', os.getcwd())
    # join server Location to find TSSpredator
    tsspredatorLocation = os.path.join(serverLocation, 'TSSpredator.jar')
    # call jar file for to write config file
    subprocess.run(['java', '-jar', tsspredatorLocation, jsonString])

    return send_file(configFilename, as_attachment=True)

@app.route('/api/exampleData/<organism>/<type>/<filename>/')
def exampleData(organism, type,filename):
    '''send config file (json) or zip directory to load example data'''
    data_path = os.getenv('TSSPREDATOR_DATA_PATH', "./exampleData")
    print(data_path)
    json_path = '{}/{}/{}_config.json'.format(data_path,organism, organism)
    files_path =  '{}/{}/Archive'.format(data_path,organism)
    if type == 'json':
        with open(json_path) as json_file:
            data = json.load(json_file)
            return {'result': json.dumps(data)}
    elif type == 'files':
        return send_from_directory(files_path, filename)

@app.route('/api/fetchData/<organism>/')
def fetchZipExample(organism):
    '''send config file (json) or zip directory to load example data'''
    data_path = os.getenv('TSSPREDATOR_DATA_PATH', "./exampleData")
    files_path =  '{}/{}'.format(data_path,organism)
    print(files_path)
    return send_from_directory(files_path, "files.zip")
