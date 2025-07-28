const express = require('express');
const { OAuth2Client } = require('google-auth-library');
const session = require('express-session');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');
const mercadopago = require('mercadopago');
const pool = require('./db');

require('dotenv').config();

console.log('▶️ [server.js] DATABASE_URL =', process.env.DATABASE_URL);

const app = express();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const { MercadoPagoConfig } = require('mercadopago');

const mp = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN
});


// Middlewares
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'segredo',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
  }
}));
app.use(express.static(path.join(__dirname, 'public')));

// Middleware para proteger rotas
function isLoggedIn(req, res, next) {
  if (req.session.user) return next();
  res.redirect('/');
}

// Middleware para verificar se é admin
function isAdmin(req, res, next) {
  if (!req.session.user) return res.status(401).send('Não autenticado');
  if (req.session.user.email !== 'bezerrayan651@gmail.com') {
    return res.status(403).send('Acesso negado');
  }
  next();
}

// Rota para verificar ID token do Google
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
      // Usuário não existe, cria um novo
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

// Rota de logout
app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao fazer logout' });
    }
    res.json({ success: true });
  });
});

// Página do painel só para usuários logados
app.get('/painel.html', isLoggedIn, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'painel.html'));
});

// Página inicial/login
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Rota para listar usuários (teste)
app.get('/usuarios', isLoggedIn, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM usuarios');
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao buscar usuários:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// Rota para obter os dados do responsável + alunos
app.get('/me', isLoggedIn, async (req, res) => {
  try {
    const { googleId } = req.session.user;

    // Busca o responsável
    const userRes = await pool.query(
      'SELECT id, nome, email, telefone, endereco FROM usuarios WHERE google_id = $1',
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

// Finalizar cadastro
app.post('/finalizar-cadastro', isLoggedIn, async (req, res) => {
  console.log('[/finalizar-cadastro] body:', req.body);

  const {
    nomeResponsavel,
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

    // 2) Atualiza os dados do usuário
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
  const googleId = req.session.user.googleId;

  try {
    // Busca o id do usuário
    const userRes = await pool.query(
      'SELECT id FROM usuarios WHERE google_id = $1',
      [googleId]
    );
    
    if (userRes.rows.length === 0) {
      return res.status(400).json({ error: 'Usuário não encontrado' });
    }

    await pool.query(
      'INSERT INTO alunos (id_usuario, nome, idade, turma) VALUES ($1, $2, $3, $4)',
      [userRes.rows[0].id, nome, idade, turma]
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

// ===== API DO MERCADO PAGO =====

// Criar preferência de pagamento
app.post('/api/pagamentos/criar-preferencia', isLoggedIn, async (req, res) => {
  try {
    const { valor, descricao, id_aluno } = req.body;
    const googleId = req.session.user.googleId;

    // Busca o id do usuário
    const userRes = await pool.query(
      'SELECT id FROM usuarios WHERE google_id = $1',
      [googleId]
    );
    
    if (userRes.rows.length === 0) {
      return res.status(400).json({ error: 'Usuário não encontrado' });
    }

    const userId = userRes.rows[0].id;

    // Cria a preferência no Mercado Pago
    const preference = {
      items: [
        {
          title: descricao || 'Mensalidade - Resiliência F.C',
          quantity: 1,
          currency_id: 'BRL',
          unit_price: parseFloat(valor)
        }
      ],
      payer: {
        name: req.session.user.nome,
        email: req.session.user.email
      },
      back_urls: {
        success: `${req.protocol}://${req.get('host')}/compracerta.html`,
        failure: `${req.protocol}://${req.get('host')}/compraerrada.html`,
        pending: `${req.protocol}://${req.get('host')}/compraerrada.html`
      },
      auto_return: 'approved',
      external_reference: `${userId}_${id_aluno}_${Date.now()}`,
      notification_url: `${req.protocol}://${req.get('host')}/api/pagamentos/webhook`
    };

    const response = await mercadopago.preferences.create(preference);

    // Salva o pagamento no banco
    await pool.query(
      `INSERT INTO pagamentos (id_usuario, id_aluno, valor, status, id_transacao_mp)
       VALUES ($1, $2, $3, 'pending', $4)`,
      [userId, id_aluno, valor, response.body.id]
    );

    res.json({ 
      preference_id: response.body.id,
      init_point: response.body.init_point
    });

  } catch (error) {
    console.error('Erro ao criar preferência:', error);
    res.status(500).json({ error: 'Erro ao gerar pagamento' });
  }
});

// Webhook do Mercado Pago
app.post('/api/pagamentos/webhook', async (req, res) => {
  try {
    const { type, data } = req.body;

    if (type === 'payment') {
      const payment = await mercadopago.payment.findById(data.id);
      
      if (payment.body.status === 'approved') {
        // Atualiza o status do pagamento no banco
        await pool.query(
          `UPDATE pagamentos 
           SET status = 'approved', data_pagamento = NOW()
           WHERE id_transacao_mp = $1`,
          [payment.body.preference_id]
        );

        console.log(`Pagamento aprovado: ${payment.body.preference_id}`);
      } else if (payment.body.status === 'rejected') {
        await pool.query(
          `UPDATE pagamentos 
           SET status = 'rejected'
           WHERE id_transacao_mp = $1`,
          [payment.body.preference_id]
        );

        console.log(`Pagamento rejeitado: ${payment.body.preference_id}`);
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Erro no webhook:', error);
    res.status(500).send('Erro no webhook');
  }
});

// Consultar status de pagamento
app.get('/api/pagamentos/:preference_id', isLoggedIn, async (req, res) => {
  try {
    const { preference_id } = req.params;
    const googleId = req.session.user.googleId;

    // Busca o pagamento no banco
    const result = await pool.query(`
      SELECT p.*, u.nome as responsavel, a.nome as aluno
      FROM pagamentos p
      JOIN usuarios u ON p.id_usuario = u.id
      LEFT JOIN alunos a ON p.id_aluno = a.id
      WHERE p.id_transacao_mp = $1 AND u.google_id = $2
    `, [preference_id, googleId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pagamento não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao consultar pagamento:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// Listar pagamentos do usuário
app.get('/api/pagamentos', isLoggedIn, async (req, res) => {
  try {
    const googleId = req.session.user.googleId;

    const result = await pool.query(`
      SELECT p.*, a.nome as aluno
      FROM pagamentos p
      JOIN usuarios u ON p.id_usuario = u.id
      LEFT JOIN alunos a ON p.id_aluno = a.id
      WHERE u.google_id = $1
      ORDER BY p.data_pagamento DESC
    `, [googleId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar pagamentos:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// ===== ROTAS DE NOTÍCIAS =====

// Notícias públicas
app.get('/noticias', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, titulo, corpo, imagem_url, criado_em FROM noticias ORDER BY criado_em DESC'
    );
    res.json(rows);
  } catch (error) {
    console.error('Erro ao buscar notícias:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// Rotas de admin para notícias
app.get('/admin/noticias', isAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM noticias ORDER BY criado_em DESC');
    res.json(rows);
  } catch (error) {
    console.error('Erro ao listar notícias:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

app.post('/admin/noticias', isAdmin, async (req, res) => {
  try {
    const { titulo, corpo, imagem_url } = req.body;
    await pool.query(
      'INSERT INTO noticias (titulo, corpo, imagem_url) VALUES ($1,$2,$3)',
      [titulo, corpo, imagem_url || null]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao criar notícia:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

app.put('/admin/noticias/:id', isAdmin, async (req, res) => {
  try {
    const { titulo, corpo, imagem_url } = req.body;
    await pool.query(
      'UPDATE noticias SET titulo=$1, corpo=$2, imagem_url=$3 WHERE id=$4',
      [titulo, corpo, imagem_url || null, req.params.id]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar notícia:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

app.delete('/admin/noticias/:id', isAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM noticias WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar notícia:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// ===== CONFIGURAÇÃO DO NODEMAILER =====

const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

app.post('/send-email', async (req, res) => {
  try {
    const { to, subject, text, html } = req.body;
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
      html
    };

    await transporter.sendMail(mailOptions);
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    res.status(500).json({ error: 'Erro ao enviar email' });
  }
});

// Inicia servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor rodando em http://0.0.0.0:${PORT}`);
  console.log(`📧 Email configurado: ${process.env.EMAIL_USER ? 'Sim' : 'Não'}`);
  console.log(`💳 Mercado Pago configurado: ${process.env.MERCADO_PAGO_ACCESS_TOKEN ? 'Sim' : 'Não'}`);
});
