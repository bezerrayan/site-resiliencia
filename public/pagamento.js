// public/js/pagamento.js

async function gerarPagamento() {
  const resposta = await fetch('http://localhost:5000/gerar-pix', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chave: "SEU-PIX-AQUI",
      valor: "20.00",
      nome: "RESILIENCIA FC"
    })
  });

  const dados = await resposta.json();

  const img = document.getElementById('qrcode');
  img.src = `data:image/png;base64,${dados.qr_code_base64}`;
  img.style.display = 'block';
}
