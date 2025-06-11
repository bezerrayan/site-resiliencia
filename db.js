// db.js
const { Pool } = require('pg');
require('dotenv').config();

console.log('▶️ [db.js] DATABASE_URL =', process.env.DATABASE_URL);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // vem do Render
  ssl: {
    rejectUnauthorized: false,
  },
});

async function criarTabelas() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id SERIAL PRIMARY KEY,
      google_id TEXT UNIQUE,
      nome TEXT,
      email TEXT UNIQUE,
      senha_hash TEXT,
      primeiro_acesso BOOLEAN DEFAULT TRUE
    )
  `);
  // logo depois do CREATE TABLE usuarios
await pool.query(`
  ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS telefone TEXT,
  ADD COLUMN IF NOT EXISTS endereco TEXT;
`);


  await pool.query(`
    CREATE TABLE IF NOT EXISTS alunos (
      id SERIAL PRIMARY KEY,
      id_usuario INTEGER REFERENCES usuarios(id),
      nome TEXT,
      idade INTEGER,
      turma TEXT
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS pagamentos (
      id SERIAL PRIMARY KEY,
      id_usuario INTEGER REFERENCES usuarios(id),
      id_aluno INTEGER REFERENCES alunos(id),
      valor REAL,
      status TEXT,
      data_pagamento TIMESTAMP,
      id_transacao_mp TEXT
    )
  `);
  
  // Cria tabela de notícias
await pool.query(`
  CREATE TABLE IF NOT EXISTS noticias (
    id SERIAL PRIMARY KEY,
    titulo TEXT NOT NULL,
    corpo TEXT NOT NULL,
    imagem_url TEXT,
    criado_em TIMESTAMP DEFAULT NOW()
  )
`);

}


criarTabelas()
  .then(() => console.log('Tabelas verificadas e criadas (se necessário)'))
  .catch(err => console.error('Erro ao criar tabelas:', err));

module.exports = pool;

