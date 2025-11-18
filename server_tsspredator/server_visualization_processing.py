from typing import  Literal
import pandas as pd
import os 
import collections
import json
import subprocess
import shutil
ORDER_TSS = ['Primary', 'Secondary', 'Internal', 'Antisense', 'Orphan']


def getHeaderIndices(header) -> dict[str, int]:
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

def getTSSClass(line, headerIndices) -> Literal['Primary'] | Literal['Secondary'] | Literal['Internal'] | Literal['Antisense'] | Literal['Orphan']:
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
        
def getTSSType(line, headerIndices) -> Literal['Detected'] | Literal['Enriched'] | Literal['Undetected']:
    '''get TSS type from MasterTable'''
    tssClass = ",".join([line[indexUsed] for indexUsed in [headerIndices['detected'], headerIndices['enriched']]])
    match tssClass:
        case '1,0':
            return 'Detected'
        case '1,1':
            return 'Enriched'
        case _:
            return "Undetected"
        
def decideMainClass(newClass, oldClass)-> Literal['Primary'] | Literal['Secondary'] | Literal['Internal'] | Literal['Antisense'] | Literal['Orphan']:
    if ORDER_TSS.index(newClass) < ORDER_TSS.index(oldClass):
        return newClass
    else:
        return oldClass
    
def readMasterTable(path) -> tuple[dict, set]:
    '''read MasterTable and return as JSON. Return also a set of unique TSS'''
    data_per_genome = {}
    tss_unique = set()
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
            tss_unique.add((superPos, superStrand))
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
    return data_per_genome, tss_unique
def get_bin_sizes(maxGenome):
    """
    Given the max genome size, return the bin size to have at most 50 bins.
    The next values should increase the number of bins by 5, and the last by 10.

    Args:
        maxGenome (int): The maximum genome size.

    Returns:
        list: A list of bin sizes
    """

    binsize_50 = maxGenome // 50
    # Cap number to be a multiple of 50.000
    binsize_50 = max((binsize_50 // 50000),1) * 50000
    binsize_5 = binsize_50 // 10
    binsize_10 = binsize_50 // 5
    return [binsize_5, binsize_10, binsize_50]

def aggregateTSS(tssList, maxGenome, outputDir, genomeName):
    '''aggregate TSS'''

    binSizes = get_bin_sizes(maxGenome)
    binSizeMax = {}
    for binSize in binSizes:
        aggregated_data_for_bin = []
        maxBinCount = {"+": 0, "-": 0}
        for i in range(0, maxGenome, binSize):
            binStart = i
            binEnd = i + binSize
            # Filter TSS found in bin and return their main class, strand and type
            filteredTSS = [(tss["mainClass"],tss["superStrand"], tss["typeTSS"]) for tss in tssList if binStart <= int(tss["superPos"]) < binEnd]
            countedTSS = dict(collections.Counter(filteredTSS))
            expanded_countedTSS = []
            binSum = {"+": 0, "-": 0}
            # Counted TSS is a dictionary with keys (mainClass, strand, typeTSS) and values are the count of TSS
            for key in countedTSS.keys():
                binSum[key[1]] += countedTSS[key]
                tempValue = split_summarized_TSS(maxGenome, binStart, binEnd, countedTSS, key)
                expanded_countedTSS.append(tempValue)
            maxBinCount = {"+": max(maxBinCount["+"], binSum["+"]), "-": max(maxBinCount["-"], binSum["-"])}
            aggregated_data_for_bin.extend(expanded_countedTSS)
        # Export for faster interaction with Gosling.js
        subdfAgg = pd.DataFrame.from_dict(aggregated_data_for_bin)
        # sort by mainClass following orderTSS, then by binStart, then by typeTSS
        subdfAgg['mainClass'] = pd.Categorical(subdfAgg['mainClass'], categories=ORDER_TSS, ordered=True)
        # set column binStart as integer
        subdfAgg['binStart'] = subdfAgg['binStart'].astype(int)
        subdfAgg = subdfAgg.sort_values(by=['mainClass', 'binStart', 'typeTSS'], ascending=[True, True, True], ignore_index=True)    
        subdfAgg.to_csv(outputDir + f'/aggregated_data_temp_{genomeName}_{binSize}.csv', index=False)
        binSizeMax[binSize] = maxBinCount
    return binSizeMax

def split_summarized_TSS(maxGenome, binStart, binEnd, countedTSS, key):
    """
    Splits the summarized TSS data into a dictionary with specific attributes.

    Args:
        maxGenome (int): The maximum genome value.
        binStart (int): The starting bin value.
        binEnd (int): The ending bin value.
        countedTSS (dict): A dictionary containing the counted TSS data.
        key (tuple): A tuple containing the mainClass, strand, and typeTSS values.

    Returns:
        dict: A dictionary containing the split summarized TSS data with attributes.

    """
    return {
        'mainClass': key[0],
        'strand': key[1],
        'typeTSS': key[2],
        'count': countedTSS[key],
        'binStart': binStart,
        'binEnd': min(binEnd, maxGenome)
    }


def adaptWiggleFile(inputDir, genome, strand, resultsDir) -> dict[str, dict]:
    '''Adapt wiggle file and return path.

    Args:
        inputDir (str): The input directory containing the wiggle file.
        genome (str): The genome name.
        strand (str): The strand type.
        resultsDir (str): The directory to store the output files.

    Returns:
        dict[str, dict]: A dictionary containing the adapted file paths.

    '''
    file_names = {}
    for fileType in ["superFivePrime", "superNormal"]:
        file, df, maxEnd = from_bedgraph_to_df(inputDir, genome, fileType, strand)   
        outputBigWig = from_bedgraph_to_bw(inputDir, genome, fileType, strand, resultsDir, file, df, maxEnd)
        file_names[fileType] = outputBigWig
    return {"filename": file_names}

def from_bedgraph_to_bw(inputDir, genome, fileType, strand, resultsDir, file, df, maxEnd) -> str:
    """
    Convert a bedGraph file to a BigWig file.

    Args:
        inputDir (str): The input directory path.
        genome (str): The name of the genome.
        fileType (str): The file type.
        strand (str): The strand information.
        resultsDir (str): The directory to store the output files.
        file (str): The input file name.
        df (pandas.DataFrame): The DataFrame containing the bedGraph data.
        maxEnd (int): The maximum end position.

    Returns:
        str: The path to the output BigWig file.
    """
    df["chrom"] = genome
    chromSizes = os.path.join(inputDir, f'{genome}.chromsizes')
    with open(chromSizes, 'w') as f:
        f.write(f'{genome}\t{maxEnd+1}\n')
    df = df[['chrom', 'start', 'end', 'value']]

    adaptedFile = file.replace("_avg.bigwig", "_adapted.bigwig")
    df.to_csv(adaptedFile, sep='\t', index=False, header=False)
    outputBigWig = os.path.join(resultsDir, f'{genome}_{fileType}{strand}.bw')
    current_location = os.getcwd()
    serverLocation = os.path.join(current_location, "server_tsspredator") if not current_location.endswith("server_tsspredator") else current_location
    serverLocation = os.getenv('TSSPREDATOR_SERVER_LOCATION', current_location)
    bedGraphPath = os.path.join(serverLocation, 'bedGraphToBigWig')
    result = subprocess.run([bedGraphPath, adaptedFile, chromSizes, outputBigWig], 
                                stdout=subprocess.PIPE, 
                                stderr=subprocess.PIPE, 
                                text=True)
    if len(result.stderr) > 0:
        print(f'Error {result.stderr}')
    return outputBigWig

def from_bedgraph_to_df(inputDir, genome, fileType, strand):
    """
    Convert a bedgraph file to a pandas DataFrame.

    Args:
        inputDir (str): The directory where the bedgraph file is located.
        genome (str): The name of the genome.
        fileType (str): The type of the file (fivePrime or Normal).
        strand (str): The strand of the file.

    Returns:
        tuple: A tuple containing the file path, the pandas DataFrame, and the maximum end value.

    """
    file = os.path.join(inputDir, f'{genome}_{fileType}{strand}_avg.bigwig')
    df = pd.read_csv(file, sep='\t')
    df["end"] = df["end"] + 1
    maxEnd = df['end'].max()
    if strand == "Minus":
        df['value'] = df['value'] * -1
        # if negative change to zero
        df['value'] = df['value'].apply(lambda x: 0 if x < 0 else x)
    return file, df, maxEnd

def parseRNAGraphs(tmpdir, genomeKey, resultsDir):
    '''Parse RNA graphs and return path as JSON. Only send path, not the whole file.

    Args:
        tmpdir (str): The temporary directory path.
        genomeKey (str): The genome key.
        resultsDir (str): The results directory path.

    Returns:
        dict: A dictionary containing the path for the RNA graph data.

    '''
    # get only last part of tmpdir
    lastPart = tmpdir.split('/')[-1]
    dataRNA = {}
    for strand in ['Plus', 'Minus']:
        dataRNA[strand] = {}
        bw_name = adaptWiggleFile(tmpdir, genomeKey, strand, resultsDir)
        for fileType in ["superFivePrime", "superNormal"]:
            dataRNA[fileType] = {
            'path': lastPart, 
            'filename': bw_name["filename"][fileType],
        }
    return dataRNA


def descriptionToObject(description):
    '''Converts a description string from a GFF file to a dictionary object.

    Args:
        description (list): A list of strings in the format "key=value".

    Returns:
        dict: A dictionary object with keys and values extracted from the description.

    Example:
        >>> descriptionToObject(['gene_name=gene_name1', 'locus_tag=tag_1', 'description=doingsomehting'])
        {'gene_name': 'gene_name1', 'locust_tag': 'tag_1', 'description': 'doingsomething'}
    '''
    data = {}
    for entry in description:
        entry = entry.split('=')
        data[entry[0]] = entry[1]
    return data


def parseSuperGFF (inputDir, genomeKey, resultsDir):
    '''Parse SuperGFF, save it as a CSV and return the maximal value'''
    data_per_gene = []
    maxValue = 0
    path = os.path.join(inputDir, f'{genomeKey}_super.gff')
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
    subdf = pd.DataFrame.from_dict(data_per_gene)
    for strand in ['Plus', 'Minus']:
        strandTest = "+" if strand == "Plus" else "-"
        subdfStrand = subdf[subdf['strand'] == strandTest]
        subdfStrand.to_csv(resultsDir + f'/gene_data_temp_{genomeKey}_{strand}.csv', index=False)
    return  maxValue

def from_fasta_to_tsv(tempDir, genomeKey, resultsDir, unique_tss):
    '''convert fasta to tsv'''
    with open(os.path.join(tempDir, f'{genomeKey}_super.fa'), 'r') as f:
        genome_as_string = ""
        for line in f:
            if line.startswith('>'):
                continue
            line = line.rstrip()
            genome_as_string += line

    length_genome = len(genome_as_string)
    for fix_strand in ["+", "-"]:
        filt_unique_tss = [tss[0] for tss in unique_tss if tss[1] == fix_strand]
        with open(os.path.join(resultsDir,f'{genomeKey}_{fix_strand}_superGenome.tsv'), 'w') as output:
            for pos in filt_unique_tss:
                if pos < 1 or pos > length_genome:
                    continue
                base = genome_as_string[pos-1]
                if fix_strand == "-":
                    base = reverse_base(base)
                output.write(f'{pos}\t{base}\n')
       

def reverse_base(base) -> str | Literal['T', 'A', 'G', 'C']:
    '''reverse base'''
    match base:
        case 'A':
            return 'T'
        case 'T':
            return 'A'
        case 'C':
            return 'G'
        case 'G':
            return 'C'
        case _:
            return base
        
def expandTSSPositions(tss_set, expansion):
    '''Expand TSS positions to visualize the positions in the genome

    Args:
        tss_set (set): A set of TSS positions represented as tuples (tss, strand).
        expansion (int): The expansion value to expand the TSS positions.

    Returns:
        set: A set of expanded TSS positions represented as tuples (tss, strand).
    '''
    expandedTSS = set()
    for tss_pair in tss_set:
        tss = int(tss_pair[0])
        strand = tss_pair[1]
        rangeIteration = range(-expansion, 1) if strand == "+" else range(expansion, -1, -1)
        for i in rangeIteration:
            expandedTSS.add((int(tss + i),strand))
    return expandedTSS

def join_tss_data(resultsDir, tempDir, genomeKey, binSizes):
    '''Join TSS data into a single file for better visualization'''

    #  subdfAgg.to_csv(outputDir + f'/aggregated_data_temp_{genomeName}_{binSize}.csv', index=False)
    #         subdfTSS.to_csv(resultsDir + f'/tss_data_temp_{genomeKey}.csv', index=False)
    # read all files starting with aggregated_data_temp_
    all_aggregated_tss = pd.DataFrame()
    for binSize in binSizes:
        agg_file = os.path.join(resultsDir, f'aggregated_data_temp_{genomeKey}_{binSize}.csv')
        df_agg = pd.read_csv(agg_file, header=0)
        df_agg['binSize'] = binSize
        all_aggregated_tss = pd.concat([all_aggregated_tss, df_agg], ignore_index=True)
    # read single TSS data
    tss_file = os.path.join(resultsDir, f'tss_data_temp_{genomeKey}.csv')
    df_tss = pd.read_csv(tss_file, header=0)
    df_tss['binSize'] = 1
    # rename column 'superPos' to 'binStart' and 'superStrand' to 'strand'
    df_tss = df_tss.rename(columns={'superPos': 'binStart', 'superStrand': 'strand'})
    # create a column 'binEnd' with value binStart 
    df_tss['binEnd'] = df_tss['binStart'] 
    # concatenate both dataframes
    all_aggregated_tss = pd.concat([all_aggregated_tss, df_tss], ignore_index=True, sort=False,  axis=0, join='outer')

    all_aggregated_tss.to_csv(os.path.join(resultsDir, f'all_tss_data_{genomeKey}.csv'), index=False)
    #


def process_results(tempDir, resultsDir): 
    """
    Process the results of TSSpredator analysis for a better visualization. 
    The results are stored in the resultsDir directory.

    Args:
        tempDir (str): The path to the temporary directory containing the analysis files.
        resultsDir (str): The path to the directory where the processed results will be saved.

    Returns:
        None
    """
    masterTablePath = tempDir + '/MasterTable.tsv'
    # copy config file to resultsDir
    configPath = tempDir + '/config.json'
    shutil.copy(configPath, resultsDir + '/config.json')
    masterTable, unique_tss = readMasterTable(masterTablePath)
    unique_tss_expanded = expandTSSPositions(unique_tss, 50)
    rnaData = {}
    for genomeKey in masterTable.keys():
        list_tss = list(masterTable[genomeKey]['TSS'].values())
        # Save data into a csv for better interaction with Gosling.js
        subdfTSS = pd.DataFrame.from_dict(list_tss)
        subdfTSS.to_csv(resultsDir + f'/tss_data_temp_{genomeKey}.csv', index=False)
        del masterTable[genomeKey]['TSS']
        # read SuperGFF and adapt for interaction with Gosling.js
        # Return length of genome to adapt the visualization
        maxValue = parseSuperGFF(tempDir, genomeKey, resultsDir)
        masterTable[genomeKey]['lengthGenome'] = maxValue
        # Aggregate TSS and save into a csv for better interaction with Gosling.js
        # Return max value of each bin to visualize
        maxValueTSS = aggregateTSS(list_tss, maxValue, resultsDir, genomeKey)
        masterTable[genomeKey]['maxAggregatedTSS'] = maxValueTSS
        rnaData[genomeKey] = {}
        rnaData[genomeKey] = parseRNAGraphs(tempDir, genomeKey, resultsDir)
        from_fasta_to_tsv(tempDir, genomeKey, resultsDir, unique_tss_expanded)
        join_tss_data(resultsDir, tempDir, genomeKey, list(masterTable[genomeKey]['maxAggregatedTSS'].keys()))
    # write compressed json in resultsDir
    with open(resultsDir + '/aggregated_data.json', 'w') as f:
        f.write(json.dumps(masterTable))
    