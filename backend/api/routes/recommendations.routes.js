// backend/api/routes/recommendations.routes.js
const express = require('express');
const { query } = require('../services/db.service');

const router = express.Router();

/**
 * GET /api/recommendations
 * Opções:
 *  - ?limit=10                 -> quantidade de filmes
 *  - ?userId=123               -> (opcional) personalizar pelo histórico do usuário
 *
 * Estratégia simples:
 * 1) Calcula média de notas e contagem na tabela 'avaliacoes'
 * 2) Ordena por média desc, depois por contagem desc, depois por criado_em desc
 * 3) Retorna os campos que o front usa (titulo, genero, diretor, imagem_s3_url)
 */
router.get('/', async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit || '12', 10) || 12, 1), 50);
    const userId = req.query.userId ? parseInt(req.query.userId, 10) : null;

    // Base: ranking geral por média/contagem
    let rows = await query(
      `SELECT
         f.id,
         f.titulo,
         f.genero,
         f.diretor,
         f.imagem_s3_url,
         COALESCE(AVG(a.nota), 0)       AS media_nota,
         COUNT(a.nota)                   AS qtd_avaliacoes,
         MAX(f.criado_em)                AS criado_em
       FROM filmes f
       LEFT JOIN avaliacoes a ON a.filme_id = f.id
       GROUP BY f.id
       ORDER BY media_nota DESC, qtd_avaliacoes DESC, criado_em DESC
       LIMIT :limit`,
      { limit }
    );

    // Personalização simples (opcional):
    // se userId veio, tenta favorecer gêneros que o usuário mais avaliou bem
    if (userId) {
      const prefs = await query(
        `SELECT f.genero, AVG(a.nota) AS media
           FROM avaliacoes a
           JOIN filmes f ON f.id = a.filme_id
          WHERE a.usuario_id = :userId
          GROUP BY f.genero
          ORDER BY media DESC`, { userId }
      );

      if (prefs && prefs.length) {
        const topGenres = new Set(prefs.filter(p => p.media >= 4).map(p => p.genero).filter(Boolean));
        if (topGenres.size) {
          // empurra itens desses gêneros pro topo mantendo ordem relativa
          rows = [
            ...rows.filter(r => topGenres.has(r.genero)),
            ...rows.filter(r => !topGenres.has(r.genero)),
          ];
        }
      }
    }

    res.json(rows || []);
  } catch (e) { next(e); }
});

module.exports = router;
