import mercadopago

sdk = mercadopago.SDK("TEST-4605221992814720-062922-b7b2b02cc9cfbb4cc031134996f51839-1255530696")

request_options = mercadopago.config.RequestOptions()
request_options.custom_headers = {
    'x-idempotency-key': '<SOME_UNIQUE_VALUE>'
}

payment_data = {
    "items": [
        {
            "id": "1",
            "title": "Mensalidade Básico",
            "quantity": 1,
            "currency_id": "BRL",
            "unit_price": 100
        }
    ],
    "back_urls": {
        "success": "https://meusite.onrender.com/compracerta",  # URL pública do Render
        "failure": "https://meusite.onrender.com/compraerrada",
        "pending": "https://meusite.onrender.com/compraerrada"
    },
    "auto_return": "all"
}





result = sdk.preference().create(payment_data, request_options)
payment = result["response"]

print(payment)