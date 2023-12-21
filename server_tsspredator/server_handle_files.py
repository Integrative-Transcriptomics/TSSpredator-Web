import json
from werkzeug.utils import secure_filename
import os

TRANSLATE_DICT = {
    "Classification_antisenseutrlength": "maxASutrLength",
    "Classification_utrlength": "maxUTRlength",
    "Clustering_clustermethod": "TSSinClusterSelectionMethod",
    "Clustering_tssclusteringdistance": "maxTSSinClusterDistance",
    "Comparative_allowedcrossgenomeshift": "allowedCompareShift",
    "Comparative_allowedcrossreplicateshift": "allowedRepCompareShift",
    "Comparative_matchingreplicates": "minNumRepMatches",
    "Normalization_enrichmentnormalizationpercentile": "texNormPercentile",
    "Normalization_normalizationpercentile": "normPercentile",
    "Prediction_baseheight": "minNormalHeight",
    "Prediction_enrichmentfactor": "min5primeToNormalFactor",
    "Prediction_processingsitefactor": "maxNormalTo5primeFactor",
    "Prediction_stepfactor": "minCliffFactor",
    "Prediction_stepfactorreduction": "minCliffFactorDiscount",
    "Prediction_stepheight": "minCliffHeight",
    "Prediction_stepheightreduction": "minCliffHeightDiscount",
    "Prediction_steplength": "minPlateauLength"
}
# # save files in temporary directory and save file paths in json string
def save_files(newTmpDir, annotationDir, genomes, replicates, genomeFasta, genomeAnnotation, enrichedForward, enrichedReverse, normalForward, normalReverse, replicateNum):
    '''save files in temporary directory and save file paths in json string, so that the .jar can read the files'''

    def save_file(file_list, dir_path, check_list=False):
        """ Helper function to save files from a list into a directory """
        paths = []
        # print(file_list)
        if isinstance(file_list, list):
            if check_list and len(file_list) == 0:
                return ""
            for file in file_list:
                if file:
                    filename = secure_filename(file.filename)
                    file_path = os.path.join(dir_path, filename)
                    file.save(file_path)
                    paths.append(file_path)
            # If a multifa file is given, return the first file path, since TSSpredator.jar scans the directory automatically
            return paths[0] 
        else:
            filename = secure_filename(file_list.filename)
            file_path = os.path.join(dir_path, filename)
            file_list.save(file_path)
            return file_path
    # group files by genome
    # get number of replicates
    numberReplicates = replicateNum['num']
    # zip wiggle files
    wiggleFiles = list(zip(enrichedForward, enrichedReverse, normalForward, normalReverse))
    nameWiggleFiles = ['enrichedforward', 'enrichedreverse', 'normalforward', 'normalreverse']

    # create batches of replicate length 
    wiggleFiles = [wiggleFiles[i:i+numberReplicates] for i in range(0, len(wiggleFiles), numberReplicates)]

    genomeZipped = zip(genomeFasta, genomeAnnotation, wiggleFiles)
    genomes_new = []
    replicates_new = []
    # save files in temporary directory
    for x, (fastaFile, gffFiles, wiggleFiles) in enumerate(genomeZipped):
      
        tempGenome = {}
        tempReplicate = []
        tempId = "genome" + str(x+1)
        tempGenome[tempId] = genomes[x][tempId]
        
        tempGenome[tempId]['genomefasta'] = save_file(fastaFile, newTmpDir)
        tempGenome[tempId]['genomeannotation'] = save_file(gffFiles, annotationDir, check_list=True)
        for id_replicate, replicate in enumerate(wiggleFiles):
            tempOneReplicate = replicates[x][tempId][id_replicate]
            repID =  chr(97 + id_replicate)
            tempOneReplicate['replicate%s'% repID] = {}
            for file, fileType in zip(replicate, nameWiggleFiles):
                tempOneReplicate['replicate%s'% repID][fileType] = save_file(file, newTmpDir)
            tempReplicate.append(tempOneReplicate)
        genomes_new.append(tempGenome)
        replicates_new.append({tempId:tempReplicate})


    return [genomes_new, replicates_new]

def save_genome_file(directory, file, genomeObject, idx, node):
    '''save file paths of genome files'''

    tmpGenome = genomeObject

    # save annotation files for each genome in individual directory
    if(node == 'genomeannotation'):
       
        filename = ''
        if(len(file) > 0):
            # go over list for genome Z, with all annotation files for genome Z
            for x in file:
                # save file x in tempDirectory
                filename = directory + '/' + secure_filename(x.filename)
                x.save(filename)
            
        # save filename of the last file -> jar: scans directory of the annotation file if multiFasta is given
        tmpGenome[idx]['genome'+str(idx+1)][node] = filename            

    else:
        # save file in temporary directory
        filename = directory + '/' + secure_filename(file.filename)
        file.save(filename)
                    
        # save filename in genome object
        tmpGenome[idx]['genome'+str(idx+1)][node] = filename

    return tmpGenome
   

def save_replicate_file(directory, file, replicateObject, genomeCounter, replicateCounter, node):
    '''save file paths of replicate files'''

    tmpRep = replicateObject

    filename = directory + '/' + secure_filename(file.filename)
    file.save(filename)

    # save filename in replicate object
    repLetter = chr(97 + replicateCounter)
    tmpRep[genomeCounter]['genome'+str(genomeCounter+1)][replicateCounter]['replicate'+repLetter][node] = filename

    return tmpRep


def create_json_for_jar(genomes, replicates, replicateNum, alignmentFilepath, projectName, parameters, rnaGraph, outputDirectory, loadConfig='false', saveConfig='false', configFile=" ", multiFasta=''):
    '''create json string that is needed as input for TSSpredator.jar'''

    json_data = {
        "loadConfig": loadConfig,
        "saveConfig": saveConfig,
        "loadAlignment": "false",
        "numReplicates": str(replicateNum['num']),
        "numberOfDatasets": str(len(genomes)),
        "configFile": configFile,
        "multiFasta": multiFasta,
        "outputDirectory": outputDirectory + '/',
        "projectName": projectName,
        "superGraphCompatibility": "igb",
        "maxGapLengthInGene": "500",
        "writeNocornacFiles": "0"
    }

    setupBox = parameters['setup']
    parameterBox = parameters['parameterBox']
    studytype = 'cond' if setupBox['typeofstudy']['value'] == 'condition' else 'align'
    json_data["mode"] = studytype


    if studytype == 'cond':
        json_data["printReplicateStats"] = "1"
    else:
        json_data["xmfa"] = alignmentFilepath

    json_data["writeGraphs"] = "1" if rnaGraph == 'true' else "0"

    # Add parameters
    for category, items in parameterBox.items():
        for key, value in items.items():
            json_key = f"{category}_{key}"
            json_data[TRANSLATE_DICT[json_key]] = str(value['value'])

    # Add genome information
    for x, genomeValue in enumerate(genomes, start=1):
        genome = genomeValue[f'genome{x}']
        json_keys = ["annotation", "genome", "outputPrefix", "outputID"]
        data_keys =  ['genomeannotation', 'genomefasta', 'name', 'outputid']
        for (js_key, data_key) in zip(json_keys, data_keys):
            json_data[f"{js_key}_{x}"] = genome[data_key]
    # print(genomes[0].values())
    json_data["idList"] = ','.join(str(genome[f'genome{x}']['alignmentid']) for x, genome in enumerate(genomes, start=1))

    # Add replicate files
    for x, currentGenome in enumerate(replicates, start=1):
        for y, replicate in enumerate(currentGenome[f'genome{x}'], start=0):
            repLetter = chr(97 + y)
            json_keys = ["fivePrimePlus", "fivePrimeMinus", "normalPlus", "normalMinus"]
            data_keys = ['enrichedforward', 'enrichedreverse', 'normalforward', 'normalreverse']
            for js_key, data_key in zip(json_keys, data_keys):
                json_key = f"{js_key}_{x}{repLetter}"
                json_data[json_key] = replicate[f'replicate{repLetter}'][data_key]

    return json.dumps(json_data, indent=4)


def handle_config_file(parameters, config, genomes, replicates):
    '''update parameter, genomes, replicate values regarding the given config file'''

    # update parameters
    parameters = handle_config_param(parameters, config, 'mode','setup', 'typeofstudy')
    parameters = handle_config_param(parameters, config, 'numberOfDatasets','setup', 'numberofgenomes')
    parameters = handle_config_param(parameters, config, 'numReplicates','setup', 'numberofreplicates')
    parameters = handle_config_param(parameters, config, 'minCliffHeight','parameterBox', 'Prediction', 'stepheight')
    parameters = handle_config_param(parameters, config, 'minCliffHeightDiscount','parameterBox', 'Prediction', 'stepheightreduction')
    parameters = handle_config_param(parameters, config, 'TSSinClusterSelectionMethod','parameterBox', 'Clustering', 'clustermethod')
    parameters = handle_config_param(parameters, config, 'allowedCompareShift','parameterBox', 'Comparative', 'allowedcrossgenomeshift')
    parameters = handle_config_param(parameters, config, 'allowedRepCompareShift','parameterBox', 'Comparative', 'allowedcrossreplicateshift')
    parameters = handle_config_param(parameters, config, 'allowedRepCompareShift','parameterBox', 'Comparative', 'allowedcrossreplicateshift')
    parameters = handle_config_param(parameters, config, 'maxASutrLength','parameterBox', 'Classification', 'antisenseutrlength')
    parameters = handle_config_param(parameters, config, 'maxNormalTo5primeFactor','parameterBox', 'Prediction', 'processingsitefactor')
    parameters = handle_config_param(parameters, config, 'maxTSSinClusterDistance','parameterBox', 'Clustering', 'tssclusteringdistance')
    parameters = handle_config_param(parameters, config, 'maxUTRlength','parameterBox', 'Classification', 'utrlength')
    parameters = handle_config_param(parameters, config, 'min5primeToNormalFactor','parameterBox', 'Prediction', 'enrichmentfactor')
    parameters = handle_config_param(parameters, config, 'minCliffFactor','parameterBox', 'Prediction', 'stepfactor')
    parameters = handle_config_param(parameters, config, 'minCliffFactorDiscount','parameterBox', 'Prediction', 'stepfactorreduction')
    parameters = handle_config_param(parameters, config, 'minNormalHeight','parameterBox', 'Prediction', 'baseheight')
    parameters = handle_config_param(parameters, config, 'minNumRepMatches','parameterBox', 'Comparative', 'matchingreplicates')
    parameters = handle_config_param(parameters, config, 'minPlateauLength','parameterBox', 'Prediction', 'steplength')
    parameters = handle_config_param(parameters, config, 'normPercentile','parameterBox', 'Normalization', 'normalizationpercentile')
    parameters = handle_config_param(parameters, config, 'texNormPercentile','parameterBox', 'Normalization', 'enrichmentnormalizationpercentile')
        
    # save multiFasta string as list
    multiFasta = config['multiFasta'].split(',')

    # update genomes
    genomes = handle_config_genomes(config, genomes, parameters)

    # update replicates
    replicates = handle_config_replicates(config, replicates, parameters)

    # alignment file
    alignmentFile = get_value(config, 'xmfa')    

    return [parameters, genomes, replicates, alignmentFile, multiFasta]


def handle_config_param(parameters, config, configVariable, parameterNode1, parameterNode2, parameterNode3=""):
    '''update parameters from config file'''
    
    # setup box
    if len(parameterNode3) == 0:
        try:
            temp = config[configVariable]

            if configVariable == 'mode':
                if temp == 'cond':
                    parameters[parameterNode1][parameterNode2]['value'] = 'condition' 
                else:
                    parameters[parameterNode1][parameterNode2]['value'] = 'genome'
                    parameters['setup']['numberofgenomes']['name'] = 'Number of Genomes'
                    parameters['parameterBox']['Comparative']['allowedcrossgenomeshift']['name'] = 'allowed cross-genome shift'
            else:
                parameters[parameterNode1][parameterNode2]['value'] = int(temp)
        except:
            print('No such value')
    # parameter box
    else:
        try:
            temp = config[configVariable]

            if configVariable == 'TSSinClusterSelectionMethod':
                parameters[parameterNode1][parameterNode2][parameterNode3]['value'] = temp

            # convert to float
            else:
                parameters[parameterNode1][parameterNode2][parameterNode3]['value'] = float(temp)
  
        except:
            print('No such value')
    
    return parameters


def handle_config_genomes(config, genomes, parameters):
    '''update genomes from config file'''

    # annotation files
    annotationFiles = dict(filter(lambda item: 'annotation_' in item[0], config.items()))
    # genome files
    genomeFiles = dict(filter(lambda item: 'genome_' in item[0], config.items()))
    # output ids
    outputIDs = dict(filter(lambda item: 'outputID_' in item[0], config.items()))
    
    # genome names
    genomeNames = dict(filter(lambda item: 'outputPrefix_' in item[0], config.items()))
    # alingment IDs
    alignmentIDs = dict(filter(lambda item: 'idList' in item[0], config.items()))

    if len(alignmentIDs) > 0:
        alignmentIDs = alignmentIDs['idList'].split(',')

    studyType = (parameters['setup']['typeofstudy']['value']).capitalize()
    genomeNum = int(parameters['setup']['numberofgenomes']['value'])

    if (genomeNum < len(genomes)):
        difference = len(genomes) - genomeNum
        genomes = genomes[:-difference or None]

    for x in range(genomeNum):
        currentGenomeName = 'genome' + str(x+1)
        genomePlaceholder = studyType + '_' + str(x+1)

        genomeName = get_value(genomeNames, 'outputPrefix_'+str(x+1), genomePlaceholder)
        alignmentID = get_value(alignmentIDs, x)
        outputID = get_value(outputIDs, 'outputID_'+str(x+1))
        genomeFile =  get_value(genomeFiles, 'genome_'+str(x+1))
        annotationFile = get_value(annotationFiles, 'annotation_'+str(x+1))
       
        tmpGenome = {currentGenomeName: { "name": genomeName, "placeholder": genomePlaceholder, "alignmentid": alignmentID, "outputid": outputID, 
                                        "genomefasta": genomeFile, "genomeannotation": annotationFile}}
        if(x >= len(genomes)):
            genomes.append(tmpGenome)
        else: 
            genomes[x] = tmpGenome
    
    return genomes

def handle_config_replicates(config, replicates, parameters):
    '''update replicates from config file'''

    # enriched forward file
    enrichedForwardFiles = dict(filter(lambda item: 'fivePrimePlus_' in item[0], config.items()))
    # enriched reverse files
    enrichedReverseFiles = dict(filter(lambda item: 'fivePrimeMinus_' in item[0], config.items()))
    # normal forward files
    normalForwardFiles = dict(filter(lambda item: 'normalPlus_' in item[0], config.items()))
    # normal reverse files
    normalReverseFiles = dict(filter(lambda item: 'normalMinus_' in item[0], config.items()))

    genomeNum = int(parameters['setup']['numberofgenomes']['value'])
    replicateNum = int(parameters['setup']['numberofreplicates']['value'])

    for x in range(genomeNum):
        currentGenomeName = 'genome' + str(x+1)
        tmpReplicate = []

        for z in range(replicateNum): 

            letter = chr(97 + z)
            currentReplicateName = 'replicate'+letter
            replicateName = 'Replicate ' + letter
        
            enrichedForward = get_value(enrichedForwardFiles, 'fivePrimePlus_'+str(x+1)+letter)
            enrichedReverse = get_value(enrichedReverseFiles, 'fivePrimeMinus_'+str(x+1)+letter)
            normalForward = get_value(normalForwardFiles, 'normalPlus_'+str(x+1)+letter)
            normalReverse = get_value(normalReverseFiles, 'normalMinus_'+str(x+1)+letter)

            tmpReplicate.append({currentReplicateName: {"name": replicateName, "enrichedforward": enrichedForward, 
                                "enrichedreverse": enrichedReverse, "normalforward": normalForward, "normalreverse": normalReverse}})
           

        tmpGenome = {currentGenomeName: tmpReplicate}

        if(x >= len(replicates)):
            replicates.append(tmpGenome)
        else: 
            replicates[x] = tmpGenome
    
    return replicates
           

def get_value(object, node, default=""):
    '''get the value from the given node from a given object '''
    value = default
    try:
        value = object[node]
    except:
        print(node + ' value not given.')
    
    return value



       





