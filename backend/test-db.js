// test-db.js (na raiz)
require('dotenv').config();
const db = require('./api/services/db.service');

(async () => {
  try {
    const [rows] = await db.query('SHOW TABLES');
    console.log('Conectado! Tabelas:', rows);
    process.exit(0);
  } catch (e) {
    console.error('Erro DB:', e);
    process.exit(1);
  }
})();
