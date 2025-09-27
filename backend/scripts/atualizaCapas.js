// scripts/atualizaCapas.js
// Atualiza capas nulas usando imagens locais em ./capas-publicas
require('dotenv').config();
const path = require('path');
const fs = require('fs');
const db = require('../api/services/db.service');
const { uploadCover } = require('../api/services/s3.service');

// Mapeia titulo -> arquivo local dentro de ./capas-publicas
const capaMap = {
  'Blade Runner 2049': 'capas-publicas/blade_runner.jpg',
  'Duna': 'capas-publicas/duna.jpg',
  'Top Gun: Maverick': 'capas-publicas/top_gun_maverick.png',
  'Mad Max: Fury Road': 'capas-publicas/mad_max_fury_road.jpg',
  'Interestelar': 'capas-publicas/interstellar.jpg'
};

(async () => {
  try {
    const [filmes] = await db.query('SELECT id, titulo FROM filmes WHERE imagem_s3_url IS NULL ORDER BY id ASC');
    if (filmes.length === 0) {
      console.log('Nenhum filme com capa nula encontrado.');
      process.exit(0);
    }

    for (const filme of filmes) {
      const localPath = capaMap[filme.titulo];
      if (!localPath) {
        console.log(`Sem imagem local mapeada para: ${filme.titulo}`);
        continue;
      }
      const absPath = path.join(process.cwd(), localPath);
      if (!fs.existsSync(absPath)) {
        console.warn(`Arquivo não encontrado: ${absPath}`);
        continue;
      }
      const buffer = fs.readFileSync(absPath);
      const ext = path.extname(absPath).slice(1).toLowerCase();
      const mimeType = `image/${ext === 'jpg' ? 'jpeg' : ext}`;

      const safeName = `${filme.id}_${filme.titulo.replace(/[^\w.\-]/g, '_')}.${ext}`;
      const key = `capas/${safeName}`;

      console.log(`Subindo capa de "${filme.titulo}" -> ${key}`);
      const url = await uploadCover({ buffer, mimeType, key });
      await db.query('UPDATE filmes SET imagem_s3_url = ? WHERE id = ?', [url, filme.id]);
      console.log(`OK: ${filme.titulo} -> ${url}`);
    }

    console.log('Concluído.');
    process.exit(0);
  } catch (e) {
    console.error('Erro no script:', e);
    process.exit(1);
  }
})();
