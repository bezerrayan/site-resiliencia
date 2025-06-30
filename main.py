from flask import Flask, render_template, redirect, jsonify
import mercadopago

# Cria o app Flask
app = Flask(__name__)

# SDK do Mercado Pago
sdk = mercadopago.SDK("TEST-4605221992814720-062922-b7b2b02cc9cfbb4cc031134996f51839-1255530696")

# Rota principal
@app.route("/")
def dashboard():
    return render_template("dashboard.html")

# Páginas de retorno do Mercado Pago
@app.route("/compracerta")
def compracerta():
    return render_template("compracerta.html")

@app.route("/compraerrada")
def compraerrada():
    return render_template("compraerrada.html")

# Rota antiga de redirecionamento (opcional, pode excluir se for usar o checkout transparente)
@app.route("/pagar")
def pagar():
    payment_data = {
        "items": [{
            "title": "Mensalidade Básico",
            "quantity": 1,
            "currency_id": "BRL",
            "unit_price": 100
        }],
        "back_urls": {
            "success": "https://site-resiliencia.onrender.com/compracerta",
            "failure": "https://site-resiliencia.onrender.com/compraerrada",
            "pending": "https://site-resiliencia.onrender.com/compraerrada"
        },
        "auto_return": "all"
    }

    result = sdk.preference().create(payment_data)
    return redirect(result["response"]["init_point"])

# ✅ Rota nova para o Checkout Transparente (retorna só o ID)
@app.route("/pagar-preferencia")
def pagar_preferencia():
    payment_data = {
        "items": [{
            "title": "Mensalidade Básico",
            "quantity": 1,
            "currency_id": "BRL",
            "unit_price": 100
        }],
        "back_urls": {
            "success": "https://site-resiliencia.onrender.com/compracerta",
            "failure": "https://site-resiliencia.onrender.com/compraerrada",
            "pending": "https://site-resiliencia.onrender.com/compraerrada"
        },
        "auto_return": "all"
    }

    result = sdk.preference().create(payment_data)
    return jsonify(id=result["response"]["id"])

# Roda o app
if __name__ == "__main__":
    app.run(debug=True)
