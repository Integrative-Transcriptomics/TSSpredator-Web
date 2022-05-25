from flask import Flask, request
from werkzeug.utils import secure_filename
import parameter
import json
import sys

app = Flask(__name__)

@app.route('/parameters/')
def parameters():
    return  parameter.getParameters()

@app.route('/input/', methods=['POST', 'GET'])
def getInput():
    #file = request.files['file']
    #name = request.form['name']
   # filename = secure_filename(file.filename)
   # print(file.read(), file=sys.stdout)
    #print(name)
    #return data
    return {'ah': 'b'}
    



if __name__ == "__main__":
    app.run(debug=True)