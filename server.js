const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();
const port = 3000;

// Configurações do Nodemailer (e-mail que VAI ENVIAR)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'seu-email-de-envio@gmail.com', // <- troque por seu e-mail que vai enviar
    pass: 'sua-senha-de-app'              // <- senha de app gerada no Google
  }
});

// Middleware para processar os dados do formulário
app.use(bodyParser.urlencoded({ extended: true }));

// Servir arquivos estáticos da pasta "public"
app.use(express.static(path.join(__dirname, 'public')));

// Rota para a página principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Rota para envio de e-mail
app.post('/send-email', (req, res) => {
  const { nome, email, telefone, assunto, mensagem } = req.body;

  const mailOptions = {
    from: 'seu-email-de-envio@gmail.com',   // <- tem que ser o mesmo do transporter
    to: 'fcresiliencia@gmail.com',          // <- e-mail que vai RECEBER
    subject: assunto,
    text: `Mensagem recebida de ${nome} (${email}, ${telefone})\n\nMensagem:\n${mensagem}`
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
      res.status(500).send('Erro ao enviar a mensagem');
    } else {
      console.log('E-mail enviado: ' + info.response);
      res.status(200).send('Mensagem enviada com sucesso');
    }
  });
});

// Inicia o servidor
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
