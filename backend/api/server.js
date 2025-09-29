// backend/api/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');

// libs opcionais (se instalou)
let helmet, morgan, rateLimit;
try { helmet = require('helmet'); } catch {}
try { morgan = require('morgan'); } catch {}
try { rateLimit = require('express-rate-limit'); } catch {}

// rotas
const authRoutes = require('./routes/auth.routes');
const moviesRoutes = require('./routes/movies.routes');
const recommendationsRoutes = require('./routes/recommendations.routes');
const ratingsRoutes = require('./routes/ratings.routes');

const app = express();

// segurança/log
if (helmet) app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
if (morgan) app.use(morgan('dev'));

// CORS pro front
app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] }));

// parsers (JSON + x-www-form-urlencoded)
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true })); // <-- importante pro login via form

// opcional: rate limit
if (rateLimit) {
  const limiter = rateLimit({ windowMs: 60_000, max: 300 });
  app.use(limiter);
}

app.get('/health', (_req, res) => res.json({ ok: true }));
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// usa as rotas
app.use('/api/auth', authRoutes);
app.use('/api/movies', moviesRoutes);
app.use('/api/recommendations', recommendationsRoutes);
app.use('/api/ratings', ratingsRoutes);

// handler de erro padrão
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Erro interno' });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 API ouvindo em http://localhost:${PORT} (env: ${process.env.NODE_ENV || 'dev'})`);
});
