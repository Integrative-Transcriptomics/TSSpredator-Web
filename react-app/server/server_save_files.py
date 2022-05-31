from werkzeug.utils import secure_filename

def save_genome_file(directory, file, genomeObject, idx, node):
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


