// /api/routes/movies.routes.js
const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const db = require('../services/db.service');
const { uploadCover } = require('../services/s3.service');
const { authRequired } = require('../services/auth.middleware');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const ok = ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype);
    if (!ok) return cb(new Error('Formato inválido. Use JPG, PNG ou WEBP.'));
    cb(null, true);
  }
});

// POST /api/movies  (multipart/form-data: titulo, genero, diretor, capa:file)
router.post('/', authRequired, upload.single('capa'), async (req, res) => {
  try {
    const { titulo, genero, diretor } = req.body;
    if (!titulo) return res.status(400).json({ error: 'Título é obrigatório' });

    let imagemUrl = null;
    if (req.file) {
      const safeName = (req.file.originalname || 'capa').replace(/[^\w.\-]/g, '_');
      const key = `capas/${uuidv4()}_${safeName}`;
      imagemUrl = await uploadCover({
        buffer: req.file.buffer,
        mimeType: req.file.mimetype,
        key
      });
    }

    const [result] = await db.query(
      'INSERT INTO filmes (titulo, genero, diretor, imagem_s3_url) VALUES (?, ?, ?, ?)',
      [titulo.trim(), genero || null, diretor || null, imagemUrl]
    );

    return res.status(201).json({
      id: result.insertId,
      titulo, genero, diretor,
      imagem_s3_url: imagemUrl
    });
  } catch (e) {
    console.error(e);
    const msg = e.message && e.message.includes('Formato inválido')
      ? e.message
      : 'Erro ao criar filme';
    return res.status(500).json({ error: msg });
  }
});

// POST /api/movies/:id/cover  (multipart/form-data: capa:file)
router.post('/:id/cover', authRequired, upload.single('capa'), async (req, res) => {
  try {
    const { id } = req.params;
    if (!req.file) return res.status(400).json({ error: 'Arquivo "capa" é obrigatório' });

    // checa se o filme existe
    const [rows] = await db.query('SELECT * FROM filmes WHERE id=?', [id]);
    if (!rows[0]) return res.status(404).json({ error: 'Filme não encontrado' });

    const safeName = (req.file.originalname || 'capa').replace(/[^\w.\-]/g, '_');
    const key = `capas/${require('uuid').v4()}_${safeName}`;

    const imagemUrl = await uploadCover({
      buffer: req.file.buffer,
      mimeType: req.file.mimetype,
      key
    });

    await db.query('UPDATE filmes SET imagem_s3_url=? WHERE id=?', [imagemUrl, id]);
    return res.json({ id: Number(id), imagem_s3_url: imagemUrl });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Erro ao atualizar capa' });
  }
});


// GET /api/movies
router.get('/', async (_req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM filmes ORDER BY criado_em DESC LIMIT 100');
    return res.json(rows);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Erro ao listar filmes' });
  }
});

// PUT /api/movies/:id
router.put('/:id', authRequired, async (req, res) => {
  try {
    const { titulo, genero, diretor } = req.body;
    const { id } = req.params;
    await db.query('UPDATE filmes SET titulo=?, genero=?, diretor=? WHERE id=?',
      [titulo, genero, diretor, id]);
    return res.json({ message: 'Atualizado' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Erro ao atualizar' });
  }
});

// DELETE /api/movies/:id
router.delete('/:id', authRequired, async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM filmes WHERE id=?', [id]);
    return res.json({ message: 'Removido' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Erro ao remover' });
  }
});

// GET /api/movies/:id  -> detalhes + média de notas (+ sua nota se enviar Bearer)
const jwt = require('jsonwebtoken');

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // detalhes do filme + média e quantidade de avaliações
    const [rows] = await db.query(`
      SELECT f.*,
             AVG(a.nota)      AS media_nota,
             COUNT(a.id)      AS qtd_avaliacoes
      FROM filmes f
      LEFT JOIN avaliacoes a ON a.filme_id = f.id
      WHERE f.id = ?
      GROUP BY f.id
      LIMIT 1
    `, [id]);

    const filme = rows[0];
    if (!filme) return res.status(404).json({ error: 'Filme não encontrado' });

    // tenta pegar a nota do usuário, se veio Authorization (opcional)
    let minha_nota = null;
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (token) {
      try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        const userId = payload.userId;
        const [mine] = await db.query(
          'SELECT nota FROM avaliacoes WHERE usuario_id=? AND filme_id=? LIMIT 1',
          [userId, id]
        );
        minha_nota = mine[0]?.nota ?? null;
      } catch { /* token inválido, segue sem minha_nota */ }
    }

    return res.json({ ...filme, media_nota: Number(filme.media_nota) || null, qtd_avaliacoes: Number(filme.qtd_avaliacoes) || 0, minha_nota });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Erro ao buscar detalhes do filme' });
  }
});


module.exports = router;
