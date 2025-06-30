from flask import Flask, render_template, redirect
import mercadopago

# Cria o app Flask
app = Flask(__name__)

# SDK do Mercado Pago
sdk = mercadopago.SDK("SEU_ACCESS_TOKEN_AQUI")

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

# Rota que inicia o pagamento
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
    payment_url = result["response"]["init_point"]

    return redirect(payment_url)

# Roda o app
if __name__ == "__main__":
    app.run(debug=True)
