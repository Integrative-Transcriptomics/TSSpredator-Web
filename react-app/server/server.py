from flask import Flask, request
from werkzeug.utils import secure_filename
import parameter
import sys
import json
import tempfile

import server_handle_files as sf


app = Flask(__name__)

@app.route('/parameters/')
def parameters():
    return  parameter.getParameters()

@app.route('/input/', methods=['POST', 'GET'])
def getInput():

    # get all input information
    genomeFasta = request.files.to_dict(flat=False)['genomefasta']
    genomeAnnotation = request.files.to_dict(flat=False)['genomeannotation']
    enrichedForward  = request.files.to_dict(flat=False)['enrichedforward']
    enrichedReverse = request.files.to_dict(flat=False)['enrichedreverse']
    normalForward = request.files.to_dict(flat=False)['normalforward']
    normalReverse = request.files.to_dict(flat=False)['normalreverse']
    alignmentFile = request.files['alignmentfile']

    projectName = request.form['projectname']
    parameters = json.loads(request.form['parameters'])
    rnaGraph = request.form['rnagraph']
    genomes = json.loads(request.form['genomes'])
    replicates = json.loads(request.form['replicates'])
    replicateNum = json.loads(request.form['replicateNum'])

    # create temporary directory, save files and save filename in genome/replicate object
    with tempfile.TemporaryDirectory() as tmpdir:
 
        # genomefasta files
        for x in range(len(genomeFasta)):
            genomes = sf.save_genome_file(tmpdir, genomeFasta[x], genomes, x, 'genomefasta')

        # genomeannotation files (not in same for loop as genomefasta, because genome annotation files don't have to be uploaded)
        for x in range(len(genomeAnnotation)):
            genomes = sf.save_genome_file(tmpdir, genomeAnnotation[x], genomes, x, 'genomeannotation')

        
        # enriched forward/reverse and normal forward/reverse files
        genomeCounter = 0
        replicateCounter = 0
        for x in range(len(enrichedForward)):
            # enrichedForward file
            fileEF = enrichedForward[x]
            replicates = sf.save_replicate_file(tmpdir, fileEF, replicates, genomeCounter, replicateCounter, 'enrichedforward')

            # enrichedReverse file
            fileER = enrichedReverse[x]
            replicates = sf.save_replicate_file(tmpdir, fileER, replicates, genomeCounter, replicateCounter, 'enrichedreverse')

            # normalForward file
            fileNF = normalForward[x]
            replicates = sf.save_replicate_file(tmpdir, fileNF, replicates, genomeCounter, replicateCounter, 'normalforward')

            # normalReverse file
            fileNR = normalReverse[x]
            replicates = sf.save_replicate_file(tmpdir, fileNR, replicates, genomeCounter, replicateCounter, 'normalreverse')

            # last replicate in the genome updated -> look at next genome and begin replicates at 0
            if(replicateCounter == replicateNum['num'] - 1):
                replicateCounter = 0
                genomeCounter += 1
            else:
                replicateCounter += 1

        # save alignment file
        alignmentFilename = tmpdir + '/' + secure_filename(alignmentFile.filename)
        alignmentFile.save(alignmentFilename)

        # create json string for jar
        jsonString = sf.create_json_for_jar(genomes, replicates, replicateNum, alignmentFilename, projectName, parameters, rnaGraph, tmpdir)

       
            


        

        
            

            

       

   # filename = secure_filename(genomeFasta.filename)
   # print(genomeFasta, file=sys.stdout)
   # print(genomeAnnotation, file=sys.stdout)
   # print(enrichedForward, file=sys.stdout)
   # print(enrichedReverse, file=sys.stdout)
   # print(normalForward, file=sys.stdout)
   # print(normalReverse, file=sys.stdout)

    # return result of tss prediction
    return {'ah': 'b'}    



if __name__ == "__main__":
    app.run(debug=True)