// /api/routes/recommendations.routes.js
const express = require('express');
const path = require('path');
const db = require(path.join(__dirname, '..', 'services', 'db.service.js'));
const { authRequired } = require(path.join(__dirname, '..', 'services', 'auth.middleware.js'));

const router = express.Router();

/**
 * GET /api/recommendations
 * 1) gêneros preferidos (média >= 4)
 * 2) recomenda filmes desses gêneros que o usuário ainda não avaliou
 * 3) fallback: filmes populares (maior média/qtd; tratar NULL sem "NULLS LAST")
 */
router.get('/', authRequired, async (req, res) => {
  const userId = req.user.id;

  try {
    // 1) gêneros preferidos
    const [favGenres] = await db.query(`
      SELECT f.genero, AVG(a.nota) AS media
      FROM avaliacoes a
      JOIN filmes f ON f.id = a.filme_id
      WHERE a.usuario_id = ?
        AND f.genero IS NOT NULL
      GROUP BY f.genero
      HAVING AVG(a.nota) >= 4
      ORDER BY media DESC
      LIMIT 3
    `, [userId]);

    let recs = [];
    if (favGenres.length > 0) {
      // 2) recomenda por gêneros
      const genres = favGenres.map(g => g.genero);
      const placeholders = genres.map(() => '?').join(',');
      const [rows] = await db.query(`
        SELECT f.*
        FROM filmes f
        WHERE f.genero IN (${placeholders})
          AND f.id NOT IN (SELECT filme_id FROM avaliacoes WHERE usuario_id = ?)
        ORDER BY f.criado_em DESC
        LIMIT 20
      `, [...genres, userId]);
      recs = rows;
    }

    if (recs.length === 0) {
      // 3) fallback populares (sem "NULLS LAST" no MySQL)
      // truque: ordenar por (media IS NULL) ASC pra empurrar NULL pro fim
      const [rows] = await db.query(`
        SELECT f.*, AVG(a.nota) AS media, COUNT(a.id) AS qtd
        FROM filmes f
        LEFT JOIN avaliacoes a ON a.filme_id = f.id
        GROUP BY f.id
        ORDER BY (AVG(a.nota) IS NULL) ASC, media DESC, qtd DESC, f.criado_em DESC
        LIMIT 20
      `);
      recs = rows;
    }

    return res.json({ genres: favGenres, recommendations: recs });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Erro ao gerar recomendações' });
  }
});

module.exports = router;
