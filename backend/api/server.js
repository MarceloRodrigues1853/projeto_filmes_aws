// backend/api/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

// rotas existentes na sua infra
const authRoutes = require('./routes/auth.routes');
const moviesRoutes = require('./routes/movies.routes');
const ratingsRoutes = require('./routes/ratings.routes');
const recommendationsRoutes = require('./routes/recommendations.routes');

const app = express();

// segurança & logs
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(morgan('dev'));

// CORS: localhost e 127.0.0.1 (Vite)
app.use(
  cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: false,
  })
);

app.use(express.json({ limit: '2mb' }));

// limiter básico
const limiter = rateLimit({ windowMs: 60_000, max: 200 });
app.use(limiter);

// health (alias em /health e /api/health)
app.get(['/health', '/api/health'], (_req, res) => res.json({ ok: true }));

// rotas da API (batendo com seus arquivos)
app.use('/api/auth', authRoutes);
app.use('/api/movies', moviesRoutes);
app.use('/api/recommendations', recommendationsRoutes);
app.use('/api/ratings', ratingsRoutes);

// handler de erro
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Erro interno' });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 API ouvindo em http://localhost:${PORT} (env: ${process.env.NODE_ENV || 'dev'})`);
});
