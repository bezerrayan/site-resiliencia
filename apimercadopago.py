import mercadopago

sdk = mercadopago.SDK("TEST-4605221992814720-062922-b7b2b02cc9cfbb4cc031134996f51839-1255530696")

request_options = mercadopago.config.RequestOptions()
request_options.custom_headers = {
    'x-idempotency-key': '<SOME_UNIQUE_VALUE>'
}

payment_data = {
    "items": [...],
    "back_urls": {
        "success": "https://site-resiliencia.onrender.com/compracerta",  # sem .html
        "failure": "https://site-resiliencia.onrender.com/compraerrada",
        "pending": "https://site-resiliencia.onrender.com/compraerrada"
    },
    "auto_return": "all"
}






result = sdk.preference().create(payment_data, request_options)
payment = result["response"]

print(payment)