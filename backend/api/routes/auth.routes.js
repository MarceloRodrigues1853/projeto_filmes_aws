// /api/routes/auth.routes.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../services/db.service');

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    let { nome, email, senha } = req.body;
    if (!nome || !email || !senha) return res.status(400).json({ error: 'Campos obrigatórios' });

    email = String(email).trim().toLowerCase();
    if (String(senha).length < 6) {
      return res.status(400).json({ error: 'Senha deve ter pelo menos 6 caracteres' });
    }

    const hash = await bcrypt.hash(senha, 10);
    const [result] = await db.query(
      'INSERT INTO usuarios (nome, email, senha_hash) VALUES (?, ?, ?)',
      [nome.trim(), email, hash]
    );
    return res.status(201).json({ message: 'Usuário registrado', userId: result.insertId });
  } catch (e) {
    // mysql2 traz 'code' = 'ER_DUP_ENTRY' para chaves únicas
    if (e && e.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'E-mail já cadastrado' });
    }
    console.error(e);
    return res.status(500).json({ error: 'Erro ao registrar' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    let { email, senha } = req.body;
    email = String(email).trim().toLowerCase();

    const [rows] = await db.query('SELECT * FROM usuarios WHERE email = ?', [email]);
    const user = rows[0];
    if (!user) return res.status(401).json({ error: 'Credenciais inválidas' });

    const ok = await bcrypt.compare(senha, user.senha_hash);
    if (!ok) return res.status(401).json({ error: 'Credenciais inválidas' });

    const token = jwt.sign(
      { sub: user.email, userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    return res.json({ token, user: { id: user.id, nome: user.nome, email: user.email } });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Erro ao autenticar' });
  }
});

module.exports = router;
