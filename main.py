from flask import Flask, render_template

app = Flask(__name__)

@app.route("/")
def dashboard():
    return render_template("dashboard.html")

@app.route("/compracerta")
def compracerta():
    return render_template("compracerta.html")

@app.route("/compraerrada")
def compraerrada():  # nome corrigido aqui
    return render_template("compraerrada.html")

if __name__ == "__main__":  # condição corrigida aqui
    app.run(debug=True)
