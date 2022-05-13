from flask import Flask
import parameter

app = Flask(__name__)

@app.route('/parameters/')
def parameters():
    return  parameter.getParameters()

if __name__ == "__main__":
    app.run(debug=True)