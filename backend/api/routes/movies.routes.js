const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { pool, query } = require('../services/db.service');
const { uploadToS3 } = require('../services/s3.service');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});
const uploadFields = upload.fields([{ name: 'imagem', maxCount: 1 }, { name: 'poster', maxCount: 1 }]);

// LISTA
router.get('/', async (_req, res, next) => {
  try {
    const rows = await query(
      `SELECT id, titulo, genero, diretor, imagem_s3_url, criado_em
         FROM filmes
        ORDER BY id DESC`
    );
    res.json(rows);
  } catch (e) { next(e); }
});

// DETALHE (+ média e contagem)
router.get('/:id', async (req, res, next) => {
  try {
    const id = req.params.id;
    const rows = await query(
      `SELECT
         f.id, f.titulo, f.genero, f.diretor, f.imagem_s3_url, f.criado_em,
         ROUND(COALESCE(AVG(a.nota), 0), 1)  AS media_nota,
         COUNT(a.nota)                       AS qtd_avaliacoes
       FROM filmes f
       LEFT JOIN avaliacoes a ON a.filme_id = f.id
      WHERE f.id = :id
      GROUP BY f.id`, { id }
    );
    if (!rows.length) return res.status(404).json({ error: 'Não encontrado' });
    // força number (mysql2 pode devolver string em DECIMAL)
    const r = rows[0];
    r.media_nota = r.media_nota != null ? Number(r.media_nota) : null;
    r.qtd_avaliacoes = Number(r.qtd_avaliacoes || 0);
    res.json(r);
  } catch (e) { next(e); }
});

// CRIA (upload S3)
router.post('/', uploadFields, async (req, res, next) => {
  try {
    const body = req.body || {};
    const titulo  = (body.titulo  ?? body.title   ?? '').trim();
    const genero  = (body.genero  ?? body.genre   ?? '').trim();
    const diretor = (body.diretor ?? body.director?? '').trim();

    const file = (req.files?.imagem?.[0]) || (req.files?.poster?.[0]) || null;
    if (!titulo) return res.status(400).json({ error: 'Campo "titulo" (ou "title") é obrigatório.' });
    if (!file)   return res.status(400).json({ error: 'Arquivo "imagem" (ou "poster") é obrigatório.' });

    const ext = (file.originalname.split('.').pop() || 'jpg').toLowerCase();
    const Key = `posters/${uuidv4()}.${ext}`;
    const Bucket = process.env.S3_BUCKET;
    const ContentType = file.mimetype || 'image/jpeg';
    const url = await uploadToS3({ Bucket, Key, Body: file.buffer, ContentType });

    const [r] = await pool.query(
      `INSERT INTO filmes (titulo, genero, diretor, imagem_s3_url, criado_em)
       VALUES (:titulo, :genero, :diretor, :url, NOW())`,
      { titulo, genero, diretor, url }
    );

    res.status(201).json({ id: r.insertId, titulo, genero, diretor, imagem_s3_url: url });
  } catch (e) { next(e); }
});

// DELETE
router.delete('/:id', async (req, res, next) => {
  try {
    const id = req.params.id;
    const [r] = await pool.query('DELETE FROM filmes WHERE id = :id', { id });
    if (!r.affectedRows) return res.status(404).json({ error: 'Não encontrado' });
    res.json({ ok: true, id });
  } catch (e) { next(e); }
});

module.exports = router;
