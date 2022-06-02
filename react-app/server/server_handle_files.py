from werkzeug.utils import secure_filename
import tempfile

def save_genome_file(directory, file, genomeObject, idx, node):

    # save annotation files for each genome in individual directory
    if(node == 'genomeannotation'):
       
        filename =''
        with tempfile.TemporaryDirectory() as tmpdir:
            # go over list for genome x, with all annotation files for genome x
            for x in file:
                newTmpDir = tmpdir.replace('\\', '/')
                
                # save file x in tempDirectory
                filename = newTmpDir + '/' + secure_filename(x.filename)
                x.save(filename)
            
        # save filename of the last file -> jar: scans directory of the annotation file if multiFasta is given
        genomeObject[idx]['genome'+str(idx+1)][node] = filename              

    else:
        # save file in temporary directory
        filename = directory + '/' + secure_filename(file.filename)
        file.save(filename)
            
        # save filename in genome object
        genomeObject[idx]['genome'+str(idx+1)][node] = filename

    return genomeObject
   

def save_replicate_file(directory, file, replicateObject, genomeCounter, replicateCounter, node):

    filename = directory + '/' + secure_filename(file.filename)
    file.save(filename)

    # save filename in replicate object
    repLetter = chr(97 + replicateCounter)
    replicateObject[genomeCounter]['genome'+str(genomeCounter+1)][replicateCounter]['replicate'+repLetter][node] = filename

    return replicateObject


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
    jsonString += '"xmfa": "' + alignmentFilepath + '",'

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

       





