from flask import Flask

app = Flask(__name__)

@app.route('/')
def index():
    return "Hello World"

@app.route('/obst/')
def obst():
    return {"obst": ["Apfel", "Banane", "Kiwi"]}


if __name__ == "__main__":
    app.run(debug=True)