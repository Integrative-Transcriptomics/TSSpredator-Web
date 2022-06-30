from werkzeug.utils import secure_filename

# save files in temporary directory and save file paths in json string
def save_files(newTmpDir, annotationDir, genomes, replicates, genomeFasta, genomeAnnotation, enrichedForward, enrichedReverse, normalForward, normalReverse, replicateNum):
    '''save files in temporary directory and save file paths in json string, so that the .jar can read the files'''

    # genomefasta files
    for x in range(len(genomeFasta)):
        genomes = save_genome_file(newTmpDir, genomeFasta[x], genomes, x, 'genomefasta')

    # genomeannotation files 
    if(len(genomeAnnotation) <= 0):
        for x in range(len(genomes)):
            genomes = save_genome_file(annotationDir, "", genomes, x, 'genomeannotation')
    else:
        for x in range(len(genomeAnnotation)):
            genomes = save_genome_file(annotationDir, genomeAnnotation[x], genomes, x, 'genomeannotation')

        
    # enriched forward/reverse and normal forward/reverse files
    genomeCounter = 0
    replicateCounter = 0
    for x in range(len(enrichedForward)):
        # enrichedForward file
        fileEF = enrichedForward[x]
        replicates = save_replicate_file(newTmpDir, fileEF, replicates, genomeCounter, replicateCounter, 'enrichedforward')

        # enrichedReverse file
        fileER = enrichedReverse[x]
        replicates = save_replicate_file(newTmpDir, fileER, replicates, genomeCounter, replicateCounter, 'enrichedreverse')

        # normalForward file
        fileNF = normalForward[x]
        replicates = save_replicate_file(newTmpDir, fileNF, replicates, genomeCounter, replicateCounter, 'normalforward')

        # normalReverse file
        fileNR = normalReverse[x]
        replicates = save_replicate_file(newTmpDir, fileNR, replicates, genomeCounter, replicateCounter, 'normalreverse')

        # last replicate in the genome updated -> look at next genome and begin replicates at 0
        if(replicateCounter == replicateNum['num'] - 1):
            replicateCounter = 0
            genomeCounter += 1
        else:
            replicateCounter += 1

    return [genomes, replicates]

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

def create_json_for_jar(genomes, replicates, replicateNum, alignmentFilepath, projectName, parameters, rnaGraph, outputDirectory,  
                        loadConfig='false', saveConfig='false', configFile=" "):
    '''create json string that is needed as input for  TSSpredator.jar'''

    jsonString = '{"loadConfig": "' + loadConfig + '", "saveConfig": "' + saveConfig + '", "loadAlignment": "false", "configFile": "' + configFile + '",'
    
    # parameter handling
    setupBox = parameters['setup']
    parameterBox = parameters['parameterBox']
    prediction = parameterBox['Prediction']
    normalization = parameterBox['Normalization']
    clustering = parameterBox['Clustering']
    classification = parameterBox['Classification']
    comparative = parameterBox['Comparative']

    studytype = "align"
    if(setupBox['typeofstudy']['value'] == 'condition'):
        studytype = 'cond'
        jsonString += '"printReplicateStats": "1",'
    else:
        jsonString += '"xmfa": "' + alignmentFilepath + '",'

    writeGraph = "0"
    if(rnaGraph == 'true'):
        writeGraph = "1"
        
    # add parameters
    jsonString += '"TSSinClusterSelectionMethod": "' + str(clustering['clustermethod']['value']) + '",'
    jsonString += '"allowedCompareShift": "' + str(comparative['allowedcrossgenomeshift']['value']) + '",'
    jsonString += '"allowedRepCompareShift": "' + str(comparative['allowedcrossreplicateshift']['value']) + '",'
    jsonString += '"maxASutrLength": "' + str(classification['antisenseutrlength']['value']) + '",'
    jsonString += '"maxGapLengthInGene": "500" ,' 
    jsonString += '"maxNormalTo5primeFactor": "' + str(prediction['processingsitefactor']['value']) + '",'
    jsonString += '"maxTSSinClusterDistance": "' + str(clustering['tssclusteringdistance']['value']) + '",'
    jsonString += '"maxUTRlength": "' + str(classification['utrlength']['value']) + '" ,'
    jsonString += '"min5primeToNormalFactor": "' + str(prediction['enrichmentfactor']['value']) + '" ,'
    jsonString += '"minCliffFactor": "' + str(prediction['stepfactor']['value']) + '" ,'
    jsonString += '"minCliffFactorDiscount": "' + str(prediction['stepfactorreduction']['value']) + '" ,'
    jsonString += '"minCliffHeight": "' + str(prediction['stepheight']['value']) + '" ,'
    jsonString += '"minCliffHeightDiscount": "' + str(prediction['stepheightreduction']['value']) + '" ,'
    jsonString += '"minNormalHeight": "' + str(prediction['baseheight']['value']) + '" ,'
    jsonString += '"minNumRepMatches": "' + str(comparative['matchingreplicates']['value']) + '" ,'
    jsonString += '"minPlateauLength": "' + str(prediction['steplength']['value']) + '",'
    jsonString += '"mode": "' + studytype + '",'
    jsonString += '"normPercentile": "' + str(normalization['normalizationpercentile']['value']) + '",'
    jsonString += '"numReplicates": "' + str(replicateNum['num']) + '",'
    jsonString += '"numberOfDatasets": "' + str(len(genomes)) + '",'
    jsonString += '"outputDirectory": "' + outputDirectory + '/",'
    jsonString += '"projectName": ' + projectName + ','    
    jsonString += '"superGraphCompatibility": "igb",'
    jsonString += '"texNormPercentile": "' + str(normalization['enrichmentnormalizationpercentile']['value']) + '",'
    jsonString += '"writeGraphs": "' + writeGraph + '",'
    jsonString += '"writeNocornacFiles": "0" ,'      
    
    # add genome fasta, genome annotation files, alignment id, output id and genome names
    idList = ''
    for x in range(len(genomes)):
        
        jsonString += '"annotation_' + str(x+1) + '": "' + genomes[x]['genome'+str(x+1)]['genomeannotation'] + '",'
        jsonString += '"genome_' + str(x+1) + '": "' + genomes[x]['genome'+str(x+1)]['genomefasta'] + '",'
        jsonString += '"outputPrefix_' + str(x+1) + '": "' + genomes[x]['genome'+str(x+1)]['name'] + '",'
        jsonString += '"outputID_' + str(x+1) + '": "' + genomes[x]['genome'+str(x+1)]['outputid'] + '",'
        
        idList += str(genomes[x]['genome'+str(x+1)]['alignmentid']) + ','

    # add idList to string
    idList = idList[:-1]
    jsonString += '"idList": "' + idList + '",'

    # add replicate files
   
    for x in range(len(replicates)):
        currentGenome = replicates[x]['genome'+str(x+1)]

        for y in range(len(currentGenome)):
            repLetter = chr(97 + y)
            jsonString += '"fivePrimePlus_' + str(x+1) + repLetter + '": "' + currentGenome[y]['replicate'+repLetter]['enrichedforward'] + '",'
            jsonString += '"fivePrimeMinus_' + str(x+1) + repLetter + '": "' + currentGenome[y]['replicate'+repLetter]['enrichedreverse'] + '",'
            jsonString += '"normalPlus_' + str(x+1) + repLetter + '": "' + currentGenome[y]['replicate'+repLetter]['normalforward'] + '",'
            jsonString += '"normalMinus_' + str(x+1) + repLetter + '": "' + currentGenome[y]['replicate'+repLetter]['normalreverse'] + '",'
            
    jsonString = jsonString[:-1]
    jsonString += '}'

    return jsonString


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
        
    # update genomes
    genomes = handle_config_genomes(config, genomes, parameters)

    # update replicates
    replicates = handle_config_replicates(config, replicates, parameters)

    # alignment file
    alignmentFile = get_value(config, 'xmfa')    

    return [parameters, genomes, replicates, alignmentFile]


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



       





