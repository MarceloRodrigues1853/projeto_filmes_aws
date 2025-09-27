// /api/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const moviesRoutes = require('./routes/movies.routes');
const recommendationsRoutes = require('./routes/recommendations.routes');
const ratingsRoutes = require('./routes/ratings.routes'); // <— novo

const app = express();
app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] })); // front vite
app.use(express.json());

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/movies', moviesRoutes);
app.use('/api/recommendations', recommendationsRoutes);
app.use('/api/ratings', ratingsRoutes); // <— novo

const PORT = process.env.PORT || 8080;
// handler de erro padrão (deixa a API mais limpa pra debugar)
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Erro interno' });
});

app.listen(PORT, () => {
  console.log(`🚀 API ouvindo em http://localhost:${PORT} (env: ${process.env.NODE_ENV || 'dev'})`);
});
