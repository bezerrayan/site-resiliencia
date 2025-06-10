// app.js
const express = require('express');
const { OAuth2Client } = require('google-auth-library');
const session = require('express-session');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const path = require('path');
const pool = require('./db'); // Pool do PostgreSQL

require('dotenv').config();

console.log('▶️ [server.js] DATABASE_URL =', process.env.DATABASE_URL);


const app = express();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Middlewares
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'segredo',
  resave: false,
  saveUninitialized: false,
}));
app.use(express.static(path.join(__dirname, 'public')));

// Rota para verificar ID token do Google, salvar/atualizar usuário e controlar primeiro acesso
app.post('/tokensignin', async (req, res) => {
  const { token } = req.body;

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    const googleId = payload.sub;
    const nome = payload.name;
    const email = payload.email;

    // Busca usuário no banco pelo google_id
    const userResult = await pool.query(
      'SELECT * FROM usuarios WHERE google_id = $1',
      [googleId]
    );

    if (userResult.rows.length === 0) {
      // Usuário não existe, cria um novo com primeiro_acesso = true
      await pool.query(
        `INSERT INTO usuarios (google_id, nome, email, primeiro_acesso)
         VALUES ($1, $2, $3, TRUE)`,
        [googleId, nome, email]
      );

      req.session.user = { googleId, nome, email, primeiro_acesso: true };
      return res.json({ primeiro_acesso: true, name: nome, email });
    } else {
      // Usuário existe
      const user = userResult.rows[0];

      req.session.user = {
        googleId,
        nome: user.nome,
        email: user.email,
        primeiro_acesso: user.primeiro_acesso,
      };

      return res.json({
        primeiro_acesso: user.primeiro_acesso,
        name: user.nome,
        email: user.email,
      });
    }
  } catch (e) {
    console.error('ID Token error:', e);
    return res.status(401).json({ error: 'Invalid ID token' });
  }
});

// Middleware para proteger rotas
function isLoggedIn(req, res, next) {
  if (req.session.user) return next();
  res.redirect('/');
}

// Página do painel só para usuários logados
app.get('/painel.html', isLoggedIn, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'painel.html'));
});

// Página inicial/login
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Rota pra listar usuários (teste)
app.get('/usuarios', isLoggedIn, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM usuarios');
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao buscar usuários:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// Nodemailer (placeholder, adicione sua config)
const transporter = nodemailer.createTransport({
  // Seu setup aqui
});
app.post('/send-email', (req, res) => {
  // Seu código para envio
});

// Inicia servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando em http://0.0.0.0:${PORT}`);
});


// Em server.js, abaixo das outras rotas:

// Rota que recebe os dados do formulário
app.post('/finalizar-cadastro', isLoggedIn, async (req, res) => {
  const { nomeAluno, idade, turma } = req.body;
  const googleId = req.session.user.googleId;

  try {
    // Atualiza o usuário para não ser mais primeiro acesso
    await pool.query(
      'UPDATE usuarios SET primeiro_acesso = FALSE WHERE google_id = $1',
      [googleId]
    );

    // Insere o aluno vinculado ao usuário
    await pool.query(
      `INSERT INTO alunos (id_usuario, nome, idade, turma)
       VALUES (
         (SELECT id FROM usuarios WHERE google_id = $1),
         $2, $3, $4
       )`,
      [googleId, nomeAluno, idade, turma]
    );

    // Redireciona para o painel
    res.redirect('/painel.html');
  } catch (err) {
    console.error('Erro ao finalizar cadastro:', err);
    res.status(500).send('Erro interno');
  }
});


// Cadastro de alunos
app.post('/alunos', isLoggedIn, async (req, res) => {
  const { nome, idade, turma } = req.body;
  const usuario = req.session.user;

  try {
    await pool.query(
      'INSERT INTO alunos (id_usuario, nome, idade, turma) VALUES ($1, $2, $3, $4)',
      [usuario.id, nome, idade, turma]
    );

    res.status(201).json({ message: 'Aluno cadastrado com sucesso' });
  } catch (err) {
    console.error('Erro ao cadastrar aluno:', err);
    res.status(500).json({ error: 'Erro interno ao cadastrar aluno' });
  }
});
