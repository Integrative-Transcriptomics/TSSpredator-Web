import pandas as pd
import os 
import collections
import json
import subprocess
from asyncio.subprocess import PIPE


def getHeaderIndices(header):
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
def stackWiggle(df):
    # Stack the df so that instead of start,end,value_enriched,value_normal we have position, value_enriched, value_normal
    df["tmpIndex"] = df.index
    df = df.set_index(['tmpIndex', 'value_enriched', 'value_normal'])[['start', "end"]].stack().reset_index()
    df = df.rename(columns={0: 'position'})
    df = df.drop(columns=['level_3', 'tmpIndex'])   
    return df

def joinWiggleFiles(file_enriched, file_normal):
    df1 = pd.read_csv(file_enriched, sep='\t')
    df2 = pd.read_csv(file_normal, sep='\t')
    
    # Get all unique start and end points
    breakpoints_start = sorted(df1[['start']].stack()._append(df2[['start']].stack()).unique())
    breakpoints_end = sorted(df1[['end']].stack()._append(df2[['end']].stack()).unique())

    # Create new intervals
    intervals = pd.DataFrame({'start': breakpoints_start, 'end': breakpoints_end})

    # Merge the intervals with the original dataframes
    result = pd.merge_asof(intervals, df1, left_on='start', right_on='start', direction='backward', suffixes=('', '_df1'))
    result = pd.merge_asof(result, df2, left_on='start', right_on='start', direction='backward', suffixes=('', '_df2'))
    # drop unnecessary columns
    result = result.drop(columns=['end_df1', 'end_df2'])
    # rename columns
    result = result.rename(columns={'value': 'value_enriched', 'value_df2': 'value_normal'})
    return result

def adaptWiggleFile(inputDir, genome, fileType, strand, resultsDir):
    '''adapt wiggle file and return path'''
    file = os.path.join(inputDir, f'{genome}_{fileType}{strand}_avg.bigwig')
    df = pd.read_csv(file, sep='\t')
    df["end"] = df["end"] + 1
    df["chrom"] = genome
    maxEnd = df['end'].max()
    chromSizes = os.path.join(inputDir, f'{genome}.chromsizes')
    if strand == "Minus":
        df['value'] = df['value'] * -1
        # if negative change to zero
        df['value'] = df['value'].apply(lambda x: 0 if x < 0 else x)

    with open(chromSizes, 'w') as f:
        f.write(f'{genome}\t{maxEnd+1}\n')
    df = df[['chrom', 'start', 'end', 'value']]
    adaptedFile = file.replace("_avg.bigwig", "_adapted.bigwig")
    df.to_csv(adaptedFile, sep='\t', index=False, header=False)
    outputBigWig = os.path.join(resultsDir, f'{genome}_{fileType}{strand}.bw')
    serverLocation = os.getenv('TSSPREDATOR_SERVER_LOCATION', os.path.join(os.getcwd(), "server_tsspredator"))
    bedGraphPath = os.path.join(serverLocation, 'bedGraphToBigWig')
    result = subprocess.run([bedGraphPath, adaptedFile, chromSizes, outputBigWig], stdout=subprocess.PIPE, 
                                stderr=subprocess.PIPE, 
                                text=True)
    print(f'Created {outputBigWig}')
    print(f'Created {result.stdout}')
    print(f'Error {result.stderr}')
    return outputBigWig
def parseRNAGraphs(tmpdir, genomeKey, resultsDir):
    '''parse RNA graphs and return path as json. Only send path, not the whole file.'''
    # get only last part of tmpdir
    lastPart = tmpdir.split('/')[-1]
    dataRNA = {}
    for strand in ['Plus', 'Minus']:
        dataRNA[strand] = {}
        for fileType in ["superFivePrime", "superNormal"]:
            # create bw file from bigwig
            bw_name = adaptWiggleFile(tmpdir, genomeKey, fileType, strand, resultsDir)
            dataRNA[fileType] = {
            'path': lastPart, 
            'filename': bw_name
        }
        # # create bw file from bigwig
        # bw_name = adaptWiggleFile(os.path.join(tmpdir, f'{genomeKey}_superFivePrime{strand}_avg.bigwig'), resultsDir)

        # joinedWiggles = joinWiggleFiles(os.path.join(tmpdir, f'{genomeKey}_superFivePrime{strand}_avg.bigwig'), os.path.join(tmpdir, f'{genomeKey}_superNormal{strand}_avg.bigwig'))
        # # stackedWiggles = stackWiggle(joinedWiggles)
        # newFileName = f'{genomeKey}_super{strand}_avgAggregated.tsv'
        # joinedWiggles.to_csv(os.path.join(resultsDir, newFileName), sep='\t', index=False)
        
    return dataRNA


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

def from_fasta_to_tsv(tempDir, genomeKey, resultsDir):
    '''convert fasta to tsv'''
    with open(os.path.join(tempDir, f'{genomeKey}_super.fa'), 'r') as f:
        with open(os.path.join(resultsDir,f'{genomeKey}_superGenome.tsv'), 'w') as output:
            length_genome = 0
            for line in f:
                if line.startswith('>'):
                    continue
                line = line.rstrip().split()
                for i, base in enumerate(line):
                    output.write(f'{length_genome + i + 1}\t{base}\n')
                length_genome += len(line)

    
def process_results(tempDir, resultsDir): 
    masterTablePath = tempDir + '/MasterTable.tsv'
    masterTable = readMasterTable(masterTablePath)
    rnaData = {}
    geneData = {}

    for genomeKey in masterTable.keys():
        masterTable[genomeKey]['TSS'] = list(masterTable[genomeKey]['TSS'].values())
        # get path of SuperGFF
        superGFFPath = tempDir + '/' + genomeKey + '_super.gff'
        # read SuperGFF
        masterTable[genomeKey]["superGFF"], maxValue = parseSuperGFF(superGFFPath)
        # masterTable[genomeKey]['super'] = maxValue
        masterTable[genomeKey]['lengthGenome'] = maxValue
        masterTable[genomeKey]['aggregatedTSS'], maxValueTSS = aggregateTSS(masterTable[genomeKey]['TSS'], maxValue)
        masterTable[genomeKey]['maxAggregatedTSS'] = maxValueTSS
        rnaData[genomeKey] = {}
        rnaData[genomeKey] = parseRNAGraphs(tempDir, genomeKey, resultsDir)
        from_fasta_to_tsv(tempDir, genomeKey, resultsDir)
    #write compressed json in resultsDir
    with open(resultsDir + '/aggregated_data.json', 'w') as f:
        f.write(json.dumps(masterTable))
        
    return 
