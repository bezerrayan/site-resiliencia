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

// Rota para obter os dados do responsável + alunos
app.get('/me', isLoggedIn, async (req, res) => {
  try {
    const { googleId } = req.session.user;

    // Busca o responsável
    const userRes = await pool.query(
      'SELECT id, nome, email FROM usuarios WHERE google_id = $1',
      [googleId]
    );
    const user = userRes.rows[0];

    // Busca os alunos vinculados
    const alunosRes = await pool.query(
      'SELECT id, nome, idade, turma FROM alunos WHERE id_usuario = $1 ORDER BY id',
      [user.id]
    );
    const alunos = alunosRes.rows;

    return res.json({ user, alunos });
  } catch (err) {
    console.error('Erro em /me:', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
});

// --- ROTAS DE NOTÍCIAS PÚBLICAS ---
app.get('/noticias', async (req, res) => {
  const { rows } = await pool.query(
    'SELECT id, titulo, corpo, imagem_url, criado_em FROM noticias ORDER BY criado_em DESC'
  );
  res.json(rows);
});

// --- ROTAS DE ADMIN (PROTEGIDAS) ---
app.use('/admin/noticias', isAdmin);

// Listagem total
app.get('/admin/noticias', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM noticias ORDER BY criado_em DESC');
  res.json(rows);
});

// Criação
app.post('/admin/noticias', async (req, res) => {
  const { titulo, corpo, imagem_url } = req.body;
  await pool.query(
    'INSERT INTO noticias (titulo, corpo, imagem_url) VALUES ($1,$2,$3)',
    [titulo, corpo, imagem_url || null]
  );
  res.json({ success: true });
});

// Edição
app.put('/admin/noticias/:id', async (req, res) => {
  const { titulo, corpo, imagem_url } = req.body;
  await pool.query(
    'UPDATE noticias SET titulo=$1, corpo=$2, imagem_url=$3 WHERE id=$4',
    [titulo, corpo, imagem_url || null, req.params.id]
  );
  res.json({ success: true });
});

// Exclusão
app.delete('/admin/noticias/:id', async (req, res) => {
  await pool.query('DELETE FROM noticias WHERE id=$1', [req.params.id]);
  res.json({ success: true });
});


// Inicia servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando em http://0.0.0.0:${PORT}`);
});


// Em server.js, abaixo das outras rotas:

app.post('/finalizar-cadastro', isLoggedIn, async (req, res) => {
  console.log('[/finalizar-cadastro] body:', req.body);

  const {
    nomeResponsavel,
    // emailResponsavel,   // removido
    telefone,
    endereco,
    nomeAluno,
    idadeAluno,
    turmaAluno
  } = req.body;
  const googleId = req.session.user.googleId;

  try {
    // 1) Busca o id do usuário pelo google_id
    const userRes = await pool.query(
      'SELECT id FROM usuarios WHERE google_id = $1',
      [googleId]
    );
    if (userRes.rows.length === 0) {
      return res.status(400).json({ error: 'Usuário não encontrado' });
    }
    const userId = userRes.rows[0].id;

    // 2) Atualiza apenas os campos necessários, sem tocar no email
    await pool.query(
      `UPDATE usuarios
         SET nome = $1,
             telefone = $2,
             endereco = $3,
             primeiro_acesso = FALSE
       WHERE id = $4`,
      [nomeResponsavel.trim(), telefone.trim(), endereco.trim(), userId]
    );

    // 3) Insere o aluno vinculado
    await pool.query(
      `INSERT INTO alunos (id_usuario, nome, idade, turma)
       VALUES ($1, $2, $3, $4)`,
      [userId, nomeAluno.trim(), parseInt(idadeAluno, 10), turmaAluno.trim()]
    );

    return res.json({ success: true });
  } catch (err) {
    console.error('[/finalizar-cadastro] erro interno:', err.stack);
    return res.status(500).json({ error: 'Erro interno ao finalizar cadastro' });
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


// Rota para listar todos os alunos (somente usuários logados)
app.get('/alunos', isLoggedIn, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        a.id, 
        a.nome, 
        a.idade, 
        a.turma,
        u.nome AS responsavel
      FROM alunos a
      JOIN usuarios u ON a.id_usuario = u.id
      ORDER BY a.id;
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao listar alunos:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

function isAdmin(req, res, next) {
  if (!req.session.user) return res.status(401).send('Não autenticado');
  // Exemplo: só quem for esse e-mail é admin
  if (req.session.user.email !== 'dono@escolinha.com') {
    return res.status(403).send('Acesso negado');
  }
  next();
}
