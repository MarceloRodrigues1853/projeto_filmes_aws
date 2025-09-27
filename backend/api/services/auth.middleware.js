// /api/services/auth.middleware.js
const jwt = require('jsonwebtoken');

function authRequired(req, res, next) {
  const auth = req.headers.authorization || '';

  // exige header no formato "Bearer <token>"
  if (!auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token ausente' });
  }

  const token = auth.slice(7);

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // deixa o user disponível nas rotas
    req.user = { id: payload.userId, email: payload.sub };
    return next();
  } catch (e) {
    if (e.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado' });
    }
    return res.status(401).json({ error: 'Token inválido' });
  }
}

module.exports = { authRequired };
