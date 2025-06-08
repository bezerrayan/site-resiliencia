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


const express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();
const app = express();

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "/auth/google/callback"
},
(accessToken, refreshToken, profile, done) => {
  // Aqui você pode salvar o usuário no banco se quiser
  return done(null, profile);
}));

passport.serializeUser((user, done) => {
  done(null, user);
});
passport.deserializeUser((user, done) => {
  done(null, user);
});

// Rotas de autenticação
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    res.redirect('/painel.html'); // redireciona se login for bem-sucedido
  }
);

// Middleware para proteger rotas
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect('/');
}

// Rota protegida de exemplo
app.get('/painel', isLoggedIn, (req, res) => {
  res.sendFile(path.join(__dirname, 'public/painel.html'));
});

// Início
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/login.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
