from ctypes import alignment
from flask import Flask, request
from werkzeug.utils import secure_filename
import parameter
import json
import sys
from io import BufferedReader

app = Flask(__name__)

@app.route('/parameters/')
def parameters():
    return  parameter.getParameters()

@app.route('/input/', methods=['POST', 'GET'])
def getInput():
    genomeFasta = request.files.to_dict(flat=False)['genomefasta']
    genomeAnnotation = request.files.to_dict(flat=False)['genomeannotation']
    enrichedForward  = request.files.to_dict(flat=False)['enrichedforward']
    enrichedReverse = request.files.to_dict(flat=False)['enrichedreverse']
    normalForward = request.files.to_dict(flat=False)['normalforward']
    normalReverse = request.files.to_dict(flat=False)['normalreverse']
    alignmentFile = request.files['alignmentfile']

    projectName = request.form['projectname']
    parameters = request.form['parameters']
    parameterPreset = request.form['parameterPreset']
    rnaGraph = request.form['rnagraph']
    genomes = request.form['genomes']
    replicates = request.form['replicates']

    filename = secure_filename(genomeFasta.filename)
    print(genomeFasta, file=sys.stdout)
    print(genomeAnnotation, file=sys.stdout)
    print(enrichedForward, file=sys.stdout)
    print(enrichedReverse, file=sys.stdout)
    print(normalForward, file=sys.stdout)
    print(normalReverse, file=sys.stdout)
    return {'ah': 'b'}    



if __name__ == "__main__":
    app.run(debug=True)