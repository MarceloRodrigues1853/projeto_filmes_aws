// backend/api/routes/auth.routes.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { query, pool } = require('../services/db.service');

const router = express.Router();

function normalizeEmail(v) {
  return String(v || '').trim().toLowerCase();
}
function getPassword(body) {
  // aceita password, senha, pass
  const raw = body?.password ?? body?.senha ?? body?.pass ?? '';
  return String(raw);
}
function signToken(payload) {
  const secret = process.env.JWT_SECRET || 'dev-secret';
  return jwt.sign(payload, secret, { expiresIn: '7d' });
}

/**
 * POST /api/auth/register
 * body (JSON ou form): { nome, email, password|senha }
 */
router.post('/register', async (req, res, next) => {
  try {
    const nome = String(req.body?.nome || '').trim();
    const email = normalizeEmail(req.body?.email);
    const password = getPassword(req.body);

    if (!nome || !email || !password) {
      return res.status(400).json({ error: 'nome, email e password/senha são obrigatórios' });
    }

    const exists = await query('SELECT id FROM usuarios WHERE email = :email', { email });
    if (exists.length) {
      return res.status(409).json({ error: 'E-mail já cadastrado' });
    }

    const senha_hash = await bcrypt.hash(password, 10);
    const [r] = await pool.query(
      'INSERT INTO usuarios (nome, email, senha_hash, criado_em) VALUES (:nome, :email, :senha_hash, NOW())',
      { nome, email, senha_hash }
    );

    const user = { id: r.insertId, nome, email };
    const token = signToken({ sub: user.id, email });

    res.status(201).json({ token, user });
  } catch (e) { next(e); }
});

/**
 * POST /api/auth/login
 * body (JSON ou form): { email, password|senha }
 */
router.post('/login', async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const password = getPassword(req.body);

    if (!email || !password) {
      return res.status(400).json({ error: 'email e password/senha são obrigatórios' });
    }

    // db.service.query retorna ARRAY de linhas
    const rows = await query(
      'SELECT id, nome, email, senha_hash FROM usuarios WHERE email = :email',
      { email }
    );

    if (!rows.length) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const u = rows[0];
    const ok = await bcrypt.compare(password, u.senha_hash || '');
    if (!ok) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const user = { id: u.id, nome: u.nome, email: u.email };
    const token = signToken({ sub: user.id, email: user.email });

    res.json({ token, user });
  } catch (e) { next(e); }
});

module.exports = router;
