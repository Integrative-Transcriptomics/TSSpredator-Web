import json
from werkzeug.utils import secure_filename
import copy
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

    parameters = create_parameters(parameters, config)
                
    # save multiFasta string as list
    multiFasta = config['multiFasta'].split(',')

    # update genomes
    genomes = handle_config_genomes(config, genomes, parameters)

    # update replicates
    replicates = handle_config_replicates(config, replicates, parameters)

    # alignment file
    alignmentFile = get_value(config, 'xmfa')    

    return [parameters, genomes, replicates, alignmentFile, multiFasta]

def create_parameters(parameters, config):
    '''create parameters from config file'''
    newParameters = copy.deepcopy(parameters)
    DICT_OVERVIEW = {
        "setup": {
            "typeofstudy": "mode",
            "numberofgenomes": "numberOfDatasets",
            "numberofreplicates": "numReplicates"
        },
        "parameterBox": {
            "Prediction": {
                "stepheight": "minCliffHeight",
                "stepheightreduction": "minCliffHeightDiscount",
                "processingsitefactor": "maxNormalTo5primeFactor",
                "enrichmentfactor": "min5primeToNormalFactor",
                "stepfactor": "minCliffFactor",
                "stepfactorreduction": "minCliffFactorDiscount",
                "baseheight": "minNormalHeight",
                "steplength": "minPlateauLength"
            },
            "Clustering": {
                "clustermethod": "TSSinClusterSelectionMethod",
                "tssclusteringdistance": "maxTSSinClusterDistance"
            },
            "Comparative": {
                "allowedcrossgenomeshift": "allowedCompareShift",
                "allowedcrossreplicateshift": "allowedRepCompareShift",
                "matchingreplicates": "minNumRepMatches"
            },
            "Normalization": {
                "normalizationpercentile": "normPercentile",
                "enrichmentnormalizationpercentile": "texNormPercentile"
            },
            "Classification": {
                "antisenseutrlength": "maxASutrLength",
                "utrlength": "maxUTRlength"
            }
        }
    }

    for category, items in DICT_OVERVIEW.items():
        # Category iterates over setup and parameterBox
        for key, value in items.items():
            print(category, key, value)
            if category == "setup":
                tempValue = config.get(value)
                if value == 'mode':
                    if tempValue == 'cond':
                        parameters[category][key]['value'] = 'condition'
                    else:
                        parameters[category][key]['value'] = 'genome'
                        parameters['setup']['numberofgenomes']['name'] = 'Number of Genomes'
                        parameters['parameterBox']['Comparative']['allowedcrossgenomeshift']['name'] = 'allowed cross-genome shift'
                else:
                    parameters[category][key]['value'] = int(tempValue)
            else:
                # ParameterBox
                for keyParameterBox, valueParameterBox in value.items():
                    tempValue = config.get(valueParameterBox)
                    # parameters = handle_config_param(parameters, config, valueParameterBox, category, key, keyParameterBox)
                    parameters[category][key][keyParameterBox]['value'] = tempValue if valueParameterBox == "TSSinClusterSelectionMethod" else float(config.get(valueParameterBox))
                    
    return parameters




def extract_config_files(config, file_prefixes):
    """Extract and organize file data from config based on a list of prefixes."""
    return {prefix.replace("_", ""): {k: v for k, v in config.items() if k.startswith(prefix)} for prefix in file_prefixes}

def create_genome_entry(index, file_data, parameters, default_placeholder):
    """
    Create a genome entry for the given index using the provided file data and parameters.

    Args:
        index (int): The index of the genome entry.
        file_data (dict): The data of the file.
        parameters (dict): The parameters for creating the genome entry.
        default_placeholder (str): The default placeholder value.

    Returns:
        dict: The genome entry.
    """
    genome_name = get_value(file_data['outputPrefix'], f'outputPrefix_{index}', default_placeholder)
    return {
        f"genome{index}": {
            "name": genome_name,
            "placeholder": default_placeholder,
            "alignmentid": get_value(file_data['idList'], index),
            "outputid": get_value(file_data['outputID'], f'outputID_{index}'),
            "genomefasta": get_value(file_data['genome'], f'genome_{index}'),
            "genomeannotation": get_value(file_data['annotation'], f'annotation_{index}')
        }
    }

def handle_config_genomes(config, genomes, parameters):
    """
    Handles the configuration of genomes by extracting file data, creating genome entries,
    and updating the genomes list.

    Args:
        config (dict): The configuration data.
        genomes (list): The list of genomes.
        parameters (dict): The parameters data.

    Returns:
        list: The updated list of genomes.
    """
    file_prefixes = ['annotation_', 'genome_', 'outputID_', 'outputPrefix_', 'idList']
    file_data = extract_config_files(config, file_prefixes)
    if file_data['idList']:
        file_data['idList'] = file_data['idList']['idList'].split(',')

    study_type = parameters['setup']['typeofstudy']['value'].capitalize()
    genome_num = int(parameters['setup']['numberofgenomes']['value'])

    genomes = genomes[:genome_num]

    for x in range(genome_num):
        genome_placeholder = f'{study_type}_{x+1}'
        tmp_genome = create_genome_entry(x + 1, file_data, parameters, genome_placeholder)

        if x >= len(genomes):
            genomes.append(tmp_genome)
        else:
            genomes[x] = tmp_genome

    return genomes


def get_replicate_files(config, genome_index, replicate_letter):
    """Retrieve file paths for a given genome index and replicate letter."""
    file_types = ['fivePrimePlus', 'fivePrimeMinus', 'normalPlus', 'normalMinus']
    return {f_type: config.get(f"{f_type}_{genome_index}{replicate_letter}", "") for f_type in file_types}

def create_replicate_entry(replicate_letter, files):
    """Create a dictionary entry for a single replicate.

    Args:
        replicate_letter (str): The letter representing the replicate.
        files (dict): A dictionary containing file paths for different types of files.

    Returns:
        dict: A dictionary entry for the replicate, with file paths organized by type.
    """
    return {
        f"replicate{replicate_letter}": {
            "name": f"Replicate {replicate_letter}",
            "enrichedforward": files['fivePrimePlus'],
            "enrichedreverse": files['fivePrimeMinus'],
            "normalforward": files['normalPlus'],
            "normalreverse": files['normalMinus']
        }
    }

def handle_config_replicates(config, replicates, parameters):
    """
    Handle the configuration and replicates data to generate a list of replicates for each genome.

    Args:
        config (dict): The configuration data.
        replicates (list): The list of replicates for each genome.
        parameters (dict): The parameters data.

    Returns:
        list: The updated list of replicates for each genome.
    """
    genome_num = int(parameters['setup']['numberofgenomes']['value'])
    replicate_num = int(parameters['setup']['numberofreplicates']['value'])

    for x in range(genome_num):
        current_genome_name = f'genome{x+1}'
        tmp_replicates = [
            create_replicate_entry(chr(97 + z), get_replicate_files(config, x+1, chr(97 + z)))
            for z in range(replicate_num)
        ]

        if x < len(replicates):
            replicates[x] = {current_genome_name: tmp_replicates}
        else:
            replicates.append({current_genome_name: tmp_replicates})

    return replicates  

def get_value(obj, node, default=""):
    '''get value from dictionary'''
    try:
        return obj.get(node, default)
    except:
        print(f'No such value for {obj}')



       





