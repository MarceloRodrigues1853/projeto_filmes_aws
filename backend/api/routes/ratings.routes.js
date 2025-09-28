const express = require('express');
const jwt = require('jsonwebtoken');
const { pool } = require('../services/db.service');

const router = express.Router();

function getUserIdFromAuth(req) {
  const auth = req.headers.authorization || '';
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (!m) return null;
  try {
    const secret = process.env.JWT_SECRET || 'dev-secret';
    const payload = jwt.verify(m[1], secret);
    return payload?.sub || null;
  } catch {
    return null;
  }
}

/**
 * PUT /api/ratings/:filmeId
 * body: { nota }   (1..5)
 * requer Bearer token
 */
router.put('/:filmeId', async (req, res, next) => {
  try {
    const usuario_id = getUserIdFromAuth(req);
    if (!usuario_id) return res.status(401).json({ error: 'unauthorized' });

    const filme_id = parseInt(req.params.filmeId, 10);
    const nota = parseInt(req.body?.nota, 10);
    if (!filme_id || !(nota >= 1 && nota <= 5)) {
      return res.status(400).json({ error: 'filmeId inválido ou nota fora de 1..5' });
    }

    // upsert na PK composta (usuario_id, filme_id)
    await pool.query(
      `INSERT INTO avaliacoes (usuario_id, filme_id, nota, criado_em)
       VALUES (:usuario_id, :filme_id, :nota, NOW())
       ON DUPLICATE KEY UPDATE nota = VALUES(nota), criado_em = NOW()`,
      { usuario_id, filme_id, nota }
    );

    res.json({ ok: true, usuario_id, filme_id, nota });
  } catch (e) { next(e); }
});

module.exports = router;
