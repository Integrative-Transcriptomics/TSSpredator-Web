from asyncio.subprocess import PIPE
from shutil import make_archive, rmtree, unpack_archive
from time import time
import traceback
from flask import Flask, request, send_file, send_from_directory, jsonify, session
from werkzeug.utils import secure_filename
from celery.exceptions import Ignore
from celery.utils.log import get_task_logger
import collections
import codecs

import json
import tempfile
import subprocess
import os
import glob


import server_tsspredator.parameter as parameter
import server_tsspredator.server_handle_files as sf
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

app = Flask(__name__, static_folder='../build', static_url_path='/')
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
    # [request, jsonString, resultDir, inputDir, annotationDir, projectName] = args
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
        tsspredatorLocation = os.path.join(serverLocation, 'TSSpredatorBigWig.jar')
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
        # print files in resultDir
        print(f"Files in {resultDir}: {os.listdir(resultDir)}")
        self.update_state(state='ZIP_RESULTS', meta={'projectName': projectName})

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

@app.route('/api/checkStatus/<task_id>', methods=['POST', 'GET'])
def task_status(task_id):
    task = helperAsyncPredator.AsyncResult(task_id)
    if task.state == 'PENDING':
        resp = Flask.make_response(app, rv="ID not found")
        resp.status_code = 404
        resp.headers['Error'] = 'ID Not found'
        # if file not found, send error message
        return resp

    elif task.state in ['STARTED', "RUNNING", "PARSING DATA", "ZIP_RESULTS"]:
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

@app.route('/status/<id>/')
def index_status(id):
    return app.send_static_file('index.html')

@app.route('/api/parameters/')
def parameters():
    ''' send parameter presets to frontend'''
    return  parameter.getParameters()

@app.route('/api/result/<filePath>/')
def getFiles(filePath):
    '''send result of TSS prediction to frontend'''
    print(filePath)
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
    
def getHeaderIndices(header):
    print(header)
    return {
        'genome': header.index('Genome') if 'Genome' in header else header.index('Condition'),
        'superPos': header.index('SuperPos'),
        'superStrand': header.index('SuperStrand'),
        'detected': header.index('detected'),
        'enriched': header.index('enriched'),
        'primary': header.index('Primary'),
        'secondary': header.index('Secondary'),
        'internal': header.index('Internal'),
        'antisense': header.index('Antisense')
    }

def getTSSClass(line, headerIndices):
    '''get TSS class from MasterTable'''
    classesIndices = [headerIndices['primary'], headerIndices['secondary'], headerIndices['internal'], headerIndices['antisense']]
    classLine = ",".join([ line[indexUsed] for indexUsed in classesIndices ])
    match classLine:
        case '1,0,0,0':
            return 'Primary'
        case '0,1,0,0':
            return 'Secondary'
        case '0,0,1,0':
            return 'Internal'
        case '0,0,0,1':
            return 'Antisense'
        case _:
            return "Orphan"
        
def getTSSType(line, headerIndices):
    '''get TSS type from MasterTable'''
    tssClass = ",".join([line[indexUsed] for indexUsed in [headerIndices['detected'], headerIndices['enriched']]])
    match tssClass:
        case '1,0':
            return 'Detected'
        case '1,1':
            return 'Enriched'
        case _:
            return "Undetected"
        
def decideMainClass(newClass, oldClass):
    orderTSS = ['Primary', 'Secondary', 'Internal', 'Antisense', 'Orphan']
    if orderTSS.index(newClass) < orderTSS.index(oldClass):
        return newClass
    else:
        return oldClass
    
def readMasterTable(path):
    '''read MasterTable and return as JSON'''
    data_per_genome = {}
    with open(path, 'r') as f:
        # Parse Header
        header = f.readline().rstrip().split('\t')
        # get indices of relevant columns
        headerIndices = getHeaderIndices(header)
        for line in f:
            line = line.rstrip().split('\t')
            genome = line[headerIndices['genome']]
            if genome not in data_per_genome:
                data_per_genome[genome] = {}
                data_per_genome[genome]['TSS'] = {}
            superPos = line[headerIndices['superPos']]
            superStrand = line[headerIndices['superStrand']]
            tss_key = f"{superPos}_{superStrand}"
            classesTSS = getTSSClass(line, headerIndices)
            if tss_key not in data_per_genome[genome]["TSS"]:
                typeTSS = getTSSType(line, headerIndices)
                if typeTSS == "Undetected":
                    continue
                data_per_genome[genome]["TSS"][tss_key] = {
                    'superPos': superPos,
                    'superStrand': superStrand,
                    'classesTSS': [classesTSS],
                    "mainClass": classesTSS,
                    'typeTSS': typeTSS, 
                    "count": 1
                }
            else:
                data_per_genome[genome]["TSS"][tss_key]['classesTSS'].append(classesTSS)
                data_per_genome[genome]["TSS"][tss_key]['mainClass'] = decideMainClass(classesTSS, data_per_genome[genome]["TSS"][tss_key]['mainClass'])   
    return data_per_genome


def descriptionToObject(description):
    '''convert description to object'''
    data = {}
    for entry in description:
        entry = entry.split('=')
        data[entry[0]] = entry[1]
    return data


def parseSuperGFF (path):
    '''parse SuperGFF and return as JSON'''
    data_per_gene = []
    maxValue = 0
    with open(path, 'r') as f:
        for line in f:
            if line.startswith('#'):
                continue
            line = line.rstrip().split('\t')
            description = descriptionToObject(line[8].split(';'))
            data_per_gene.append({
                "start": line[3],
                "end": line[4],
                "strand": line[6],
                "locus_tag": description.get('locus_tag', ''),
                "gene_name": description.get('gene_name', ''),
                "product": description.get('product', ''),
            })
            maxValue = max(maxValue, int(line[4]))
            
    return data_per_gene, maxValue
    
def fromBigWigToJSON(path):
    '''parse bigwig file and return as JSON'''
    data = []
    with open(path, 'r') as f:
        for line in f:
            if line.startswith('start'):
                continue
            line = line.rstrip().split(';')
            data.append(
            {
                "start": line[0],
                "value": float(line[2])
            }
            )
            if line[1] != line[0]:
                data.append(
                {
                    "start": line[1],
                    "value": float(line[2])
                }
                )
    return data

def parseRNAGraphs(tmpdir, genomeKey):
    '''parse RNA graphs and return as JSON'''
    print(tmpdir)
    # get only last part of tmpdir
    lastPart = tmpdir.split('/')[-1]
    data_per_type = {}
    data_per_type['plus'] = {}
    data_per_type['minus'] = {}
    for graphType in ['NormalPlus', 'NormalMinus', 'FivePrimePlus', 'FivePrimeMinus']:
        graphPath = os.path.join(tmpdir, f'{genomeKey}_super{graphType}_avg.bigwig')
        justGraphType = graphType.replace('Plus', '').replace('Minus', '')
        strand = "plus" if "Plus" in graphType else "minus"
        if os.path.exists(graphPath):
            data_per_type[strand][justGraphType] = {'path': lastPart, 'filename': f'{genomeKey}_super{graphType}_avg.bigwig'}
    return data_per_type

def aggregateTSS(tssList, maxGenome):
    '''aggregate TSS'''
    aggregatedTSS = {}
    binSizes = [5000,10000,50000]
    binSizeMax = {}
    for binSize in binSizes:
        aggregatedTSS[binSize] = []
        maxBinCount = {"+": 0, "-": 0}
        for i in range(0, maxGenome, binSize):
            binStart = i
            binEnd = i + binSize
            filteredTSS = [(tss["mainClass"],tss["superStrand"], tss["typeTSS"]) for tss in tssList if binStart <= int(tss["superPos"]) < binEnd]
            countedTSS = dict(collections.Counter(filteredTSS))
            expanded_countedTSS = []
            binSum = {"+": 0, "-": 0}
            for key in countedTSS.keys():

                binSum[key[1]] += countedTSS[key]
                tempValue = {}
                tempValue['mainClass'] = key[0]
                tempValue['strand'] = key[1]
                tempValue['typeTSS'] = key[2]
                tempValue['count'] = countedTSS[key]
                
                tempValue['binStart'] = binStart

                tempValue['binEnd'] = min(binEnd, maxGenome)
                expanded_countedTSS.append(tempValue)
            maxBinCount = {"+": max(maxBinCount["+"], binSum["+"]), "-": max(maxBinCount["-"], binSum["-"])}
            aggregatedTSS[binSize].extend(expanded_countedTSS)
        binSizeMax[binSize] = maxBinCount
       
    return aggregatedTSS, binSizeMax


@app.route('/api/provideBigWig/<filePath>/<fileName>/')
def provideBigWig(filePath, fileName):
    '''provide bigwig file to frontend'''
    # get path of bigwig file
    #providing bigwig file to frontend
    print("Provide bigwig file")
    print(filePath)
    completePath = tempfile.gettempdir().replace('\\', '/') + '/' + filePath + '/' + fileName
    print(completePath)
    if os.path.exists(completePath):
        #parse bigwig file and return as JSON
        # return jsonify(fromBigWigToJSON(completePath))
        return send_file(completePath, mimetype='text/plain')
    else:
        resp = Flask.make_response(app, rv="File not found")
        resp.status_code = 404
        resp.headers['Error'] = 'File Not found'
        # if file not found, send error message
        return resp
       
@app.route('/api/TSSViewer/<filePath>/')
def getTSSViewer(filePath):
    '''send result of TSS prediction to frontend'''
    # get path of zip file
    completePath = tempfile.gettempdir().replace('\\', '/') + '/' + filePath + '/result.zip'
    if os.path.exists(completePath):
         # Unzip MasterTable
        rnaData = {}
        try:
            tmpdir = tempfile.mkdtemp(prefix='tmpPredViewer')
            unpack_archive(completePath, tmpdir)
            # get path of MasterTable
            masterTablePath = tmpdir + '/MasterTable.tsv'
            # read MasterTable
            masterTable = readMasterTable(masterTablePath)
            for genomeKey in masterTable.keys():
                masterTable[genomeKey]['TSS'] = list(masterTable[genomeKey]['TSS'].values())
                # get path of SuperGFF
                superGFFPath = tmpdir + '/' + genomeKey + '_super.gff'
                # read SuperGFF
                masterTable[genomeKey]['superGFF'], maxValue = parseSuperGFF(superGFFPath)
                masterTable[genomeKey]['maxValue'] = maxValue
                masterTable[genomeKey]['aggregatedTSS'], maxValueTSS = aggregateTSS(masterTable[genomeKey]['TSS'], maxValue)
                masterTable[genomeKey]['maxAggregatedTSS'] = maxValueTSS
                rnaData[genomeKey] = {}
                rnaData[genomeKey] = parseRNAGraphs(tmpdir, genomeKey)
            test = jsonify({'result': 'success', 'data': masterTable, 'rnaData': rnaData})
            return test
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
    print(jsonString)
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
