from werkzeug.utils import secure_filename

# save files in temporary directory and save file paths in json string
def save_files(newTmpDir, annotationDir, genomes, replicates, genomeFasta, genomeAnnotation, enrichedForward, enrichedReverse, normalForward, normalReverse, replicateNum ):

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

# save file paths of genome files
def save_genome_file(directory, file, genomeObject, idx, node):

    tmpGenome = genomeObject

    # save annotation files for each genome in individual directory
    if(node == 'genomeannotation'):
       
        filename = ''
        if(len(file) > 0):
            # go over list for genome x, with all annotation files for genome x
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
   
# save file paths of replicate files 
def save_replicate_file(directory, file, replicateObject, genomeCounter, replicateCounter, node):

    tmpRep = replicateObject

    filename = directory + '/' + secure_filename(file.filename)
    file.save(filename)

    # save filename in replicate object
    repLetter = chr(97 + replicateCounter)
    tmpRep[genomeCounter]['genome'+str(genomeCounter+1)][replicateCounter]['replicate'+repLetter][node] = filename

    return tmpRep

# json to run TSS prediction
def create_json_for_jar(genomes, replicates, replicateNum, alignmentFilepath, projectName, parameters, rnaGraph, outputDirectory,  
                        loadConfig='false', saveConfig='false', configFile=" "):

    # parameter handling
    setupBox = parameters['setup']
    parameterBox = parameters['parameterBox']
    prediction = parameterBox['Prediction']
    normalization = parameterBox['Normalization']
    clustering = parameterBox['Clustering']
    classification = parameterBox['Classification']
    comparative = parameterBox['Comparative']

    jsonString = '{'
    jsonString += '"loadConfig": "' + loadConfig + '", "saveConfig": "' + saveConfig + '", "loadAlignment": "false", "configFile": "' + configFile + '",'

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


# update parameter, genome, replicate values regarding the config file
def handle_config_file(parameters, config, genomes, replicates):

    # update parameters
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
    parameters = handle_config_param(parameters, config, 'minCliffHeight','parameterBox', 'Prediction', 'stepheight')
    parameters = handle_config_param(parameters, config, 'minCliffHeightDiscount','parameterBox', 'Prediction', 'stepheightreduction')
    parameters = handle_config_param(parameters, config, 'minNormalHeight','parameterBox', 'Prediction', 'baseheight')
    parameters = handle_config_param(parameters, config, 'minNumRepMatches','parameterBox', 'Comparative', 'matchingreplicates')
    parameters = handle_config_param(parameters, config, 'minPlateauLength','parameterBox', 'Prediction', 'steplength')
    parameters = handle_config_param(parameters, config, 'mode','setup', 'typeofstudy')
    parameters = handle_config_param(parameters, config, 'normPercentile','parameterBox', 'Normalization', 'normalizationpercentile')
    parameters = handle_config_param(parameters, config, 'numReplicates','setup', 'numberofreplicates')
    parameters = handle_config_param(parameters, config, 'numberOfDatasets','setup', 'numberofgenomes')
    parameters = handle_config_param(parameters, config, 'texNormPercentile','parameterBox', 'Normalization', 'enrichmentnormalizationpercentile')
        
    # update genomes
    genomes = handle_config_genomes(config, genomes, parameters)

    # update replicates
    replicates = handle_config_replicates(config, replicates, parameters)

    return [parameters, genomes, replicates]

# update parameters from config file
def handle_config_param(parameters, config, configVariable, parameterNode1, parameterNode2, parameterNode3=""):
    
    # setup box
    if len(parameterNode3) == 0:
        try:
            temp = config[configVariable]

            if configVariable == 'mode' and temp == 'cond':
                temp = 'condition'
            elif configVariable == 'mode' and temp =='align':
                temp = 'genome'

            parameters[parameterNode1][parameterNode2]['value'] = temp
        except:
            print('No such value')
    # parameter box
    else:
        try:
            temp = config[configVariable]
            parameters[parameterNode1][parameterNode2][parameterNode3]['value'] = temp
        except:
            print('No such value')
    
    return parameters

# update genomes from config file
def handle_config_genomes(config, genomes, parameters):
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

        genomeName = genomePlaceholder
        alignmentID = ""
        outputID = ""
        genomeFile = ""
        annotationFile = ""

        try:
            genomeName = genomeNames['outputPrefix_'+str(x+1)]
        except:
            print('out of bound')
        try:
            alignmentID = alignmentIDs[x]
        except:
            print('out of bound')
        try:
            outputID = outputIDs['outputID_'+str(x+1)]
        except:
            print('out of bound')
        try:
            genomeFile = genomeFiles['genome_'+str(x+1)]
        except:
            print('out of bound')
        try:
            annotationFile = annotationFiles['annotation_'+str(x+1)]
        except:
            print('out of bound')


        tmpGenome = {currentGenomeName: { "name": genomeName, "placeholder": genomePlaceholder, "alignmentid": alignmentID, "outputid": outputID, 
                                        "genomefasta": genomeFile, "genomeannotation": annotationFile}}
        if(x >= len(genomes)):
            genomes.append(tmpGenome)
        else: 
            genomes[x] = tmpGenome
    
    return genomes

# update replicates from config file
def handle_config_replicates(config, replicates, parameters):

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
        
            enrichedForward = ""
            enrichedReverse = ""
            normalForward = ""
            normalReverse = ""

            try:
                enrichedForward = enrichedForwardFiles['fivePrimePlus_'+str(x+1)+letter]
            except:
                print('out of bound')
            try:
                enrichedReverse = enrichedReverseFiles['fivePrimeMinus_'+str(x+1)+letter]
            except:
                print('out of bound')
            try:
                normalForward = normalForwardFiles['normalPlus_'+str(x+1)+letter]
            except:
                print('out of bound')
            try:
                normalReverse = normalReverseFiles['normalMinus_'+str(x+1)+letter]
            except:
                print('out of bound')

            tmpReplicate.append({currentReplicateName: {"name": replicateName, "enrichedforward": enrichedForward, 
                                "enrichedreverse": enrichedReverse, "normalforward": normalForward, "normalreverse": normalReverse}})
           

        tmpGenome = {currentGenomeName: tmpReplicate}

        if(x >= len(replicates)):
            replicates.append(tmpGenome)
        else: 
            replicates[x] = tmpGenome
    
    return replicates
           


   

    return replicates



       





