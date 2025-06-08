const express = require('express');
const { OAuth2Client } = require('google-auth-library');
const session = require('express-session');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const app = express();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Middlewares
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'segredo',
  resave: false,
  saveUninitialized: false
}));
app.use(express.static(path.join(__dirname, 'public')));

// Rota para verificar ID token do Google
app.post('/tokensignin', async (req, res) => {
  const { token } = req.body;
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload();
    req.session.user = { googleId: payload.sub, name: payload.name, email: payload.email };
    return res.json({ name: payload.name, email: payload.email });
  } catch (e) {
    console.error('ID Token error:', e);
    return res.status(401).json({ error: 'Invalid ID token' });
  }
});

// Nodemailer setup (seu código existente)
const transporter = nodemailer.createTransport({ /* ... */ });
app.post('/send-email', (req, res) => { /* ... */ });

// Autorização de rota para painel
function isLoggedIn(req, res, next) {
  if (req.session.user) return next();
  res.redirect('/');
}
app.get('/painel.html', isLoggedIn, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'painel.html'));
});

// Rota raiz
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando em http://localhost:${PORT}`));