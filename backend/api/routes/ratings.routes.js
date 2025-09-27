// /api/routes/ratings.routes.js
const express = require('express');
const path = require('path');
const db = require(path.join(__dirname, '..', 'services', 'db.service.js'));
const { authRequired } = require(path.join(__dirname, '..', 'services', 'auth.middleware.js'));

const router = express.Router();

/**
 * POST /api/ratings
 * body: { filmeId: number, nota: 1..5 }
 * cria OU atualiza a nota do usuário para o filme
 */
router.post('/', authRequired, async (req, res) => {
  try {
    const { filmeId, nota } = req.body;
    if (!filmeId || !Number.isInteger(nota) || nota < 1 || nota > 5) {
      return res.status(400).json({ error: 'Parâmetros inválidos' });
    }
    const userId = req.user.id;

    // upsert simples
    const [exists] = await db.query(
      'SELECT id FROM avaliacoes WHERE usuario_id=? AND filme_id=?',
      [userId, filmeId]
    );
    if (exists[0]) {
      await db.query('UPDATE avaliacoes SET nota=?, criado_em=NOW() WHERE id=?', [nota, exists[0].id]);
    } else {
      await db.query('INSERT INTO avaliacoes (usuario_id, filme_id, nota) VALUES (?,?,?)',
        [userId, filmeId, nota]);
    }
    return res.json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Erro ao registrar avaliação' });
  }
});

/**
 * GET /api/ratings/:filmeId
 * retorna a nota do usuário logado para um filme (se existir)
 */
router.get('/:filmeId', authRequired, async (req, res) => {
  try {
    const userId = req.user.id;
    const filmeId = Number(req.params.filmeId);
    const [rows] = await db.query(
      'SELECT nota FROM avaliacoes WHERE usuario_id=? AND filme_id=?',
      [userId, filmeId]
    );
    return res.json({ nota: rows[0]?.nota ?? null });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Erro ao buscar avaliação' });
  }
});

// PUT /api/ratings/:filmeId  -> body: { nota: 1..5 }  (cria/atualiza)
router.put('/:filmeId', authRequired, async (req, res) => {
  try {
    const userId = req.user.id;
    const filmeId = Number(req.params.filmeId);
    const { nota } = req.body;

    if (!Number.isInteger(filmeId) || !Number.isInteger(nota) || nota < 1 || nota > 5) {
      return res.status(400).json({ error: 'Parâmetros inválidos' });
    }

    // valida se o filme existe
    const [f] = await db.query('SELECT id FROM filmes WHERE id=?', [filmeId]);
    if (!f[0]) return res.status(404).json({ error: 'Filme não encontrado' });

    // upsert
    const [exists] = await db.query(
      'SELECT id FROM avaliacoes WHERE usuario_id=? AND filme_id=?',
      [userId, filmeId]
    );

    if (exists[0]) {
      await db.query('UPDATE avaliacoes SET nota=?, criado_em=NOW() WHERE id=?', [nota, exists[0].id]);
      return res.json({ ok: true, updated: true });
    } else {
      await db.query('INSERT INTO avaliacoes (usuario_id, filme_id, nota) VALUES (?,?,?)',
        [userId, filmeId, nota]);
      return res.status(201).json({ ok: true, created: true });
    }
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Erro ao salvar avaliação' });
  }
});


module.exports = router;
