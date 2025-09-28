const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { pool, query } = require('../services/db.service');
const { uploadToS3 } = require('../services/s3.service');

const router = express.Router();

// Multer em memória; aceita campo 'imagem' (PT) ou 'poster' (EN)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});
const uploadFields = upload.fields([
  { name: 'imagem', maxCount: 1 },
  { name: 'poster', maxCount: 1 },
]);

/* ------------------ LISTA (GET /api/movies) ------------------ */
router.get('/', async (_req, res, next) => {
  try {
    // Tabela: filmes (PT-BR)
    const rows = await query(
      `SELECT
         id,
         titulo,
         genero,
         diretor,
         imagem_s3_url,
         criado_em
       FROM filmes
       ORDER BY id DESC`
    );
    res.json(rows);
  } catch (e) { next(e); }
});

/* ------------------ DETALHE (GET /api/movies/:id) ------------------ */
router.get('/:id', async (req, res, next) => {
  try {
    const rows = await query(
      `SELECT
         id,
         titulo,
         genero,
         diretor,
         imagem_s3_url,
         criado_em
       FROM filmes
       WHERE id = :id`,
      { id: req.params.id }
    );
    if (!rows.length) return res.status(404).json({ error: 'Não encontrado' });
    res.json(rows[0]);
  } catch (e) { next(e); }
});

/* ------------------ CRIA (POST /api/movies) ------------------ */
router.post('/', uploadFields, async (req, res, next) => {
  try {
    const body = req.body || {};
    const titulo  = (body.titulo  ?? body.title   ?? '').trim();
    const genero  = (body.genero  ?? body.genre   ?? '').trim();
    const diretor = (body.diretor ?? body.director?? '').trim();

    const file = (req.files?.imagem?.[0]) || (req.files?.poster?.[0]) || null;
    if (!titulo) return res.status(400).json({ error: 'Campo "titulo" (ou "title") é obrigatório.' });
    if (!file)   return res.status(400).json({ error: 'Arquivo "imagem" (ou "poster") é obrigatório.' });

    // Upload no S3
    const ext = (file.originalname.split('.').pop() || 'jpg').toLowerCase();
    const Key = `posters/${uuidv4()}.${ext}`;
    const Bucket = process.env.S3_BUCKET;
    const ContentType = file.mimetype || 'image/jpeg';
    const url = await uploadToS3({ Bucket, Key, Body: file.buffer, ContentType });

    // Insert na tabela FILMES
    const [r] = await pool.query(
      `INSERT INTO filmes (titulo, genero, diretor, imagem_s3_url, criado_em)
       VALUES (:titulo, :genero, :diretor, :url, NOW())`,
      { titulo, genero, diretor, url }
    );

    res.status(201).json({
      id: r.insertId,
      titulo,
      genero,
      diretor,
      imagem_s3_url: url,
    });
  } catch (e) { next(e); }
});

/* ------------------ DELETE (DELETE /api/movies/:id) ------------------ */
router.delete('/:id', async (req, res, next) => {
  try {
    const id = req.params.id;
    const [r] = await pool.query('DELETE FROM filmes WHERE id = :id', { id });
    if (!r.affectedRows) return res.status(404).json({ error: 'Não encontrado' });
    res.json({ ok: true, id });
  } catch (e) { next(e); }
});

module.exports = router;
