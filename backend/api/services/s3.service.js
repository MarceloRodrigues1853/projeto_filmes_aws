// /api/services/s3.service.js
const AWS = require('aws-sdk');

// SDK v2
const s3 = new AWS.S3({ region: process.env.AWS_REGION });

/**
 * Faz upload de uma capa para o S3 e retorna a URL pública.
 * - Sanitiza a chave
 * - Adiciona cache para servir imagem mais rápido
 * - Não usa ACL: policy do bucket já torna os objetos públicos (GetObject)
 */
async function uploadCover({ buffer, mimeType, key }) {
  // sanitiza nome/chave por segurança (mantém / para "pastas" virtuais)
  const safeKey = String(key).replace(/[^\w.\-\/]/g, '_');

  const params = {
    Bucket: process.env.S3_BUCKET,          // só o nome do bucket
    Key: safeKey,
    Body: buffer,
    ContentType: mimeType,
    CacheControl: 'public, max-age=31536000, immutable' // 1 ano
    // nada de ACL aqui
  };

  try {
    await s3.upload(params).promise();

    // monta a URL pública canônica
    const publicUrl = `https://${process.env.S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${encodeURIComponent(safeKey)}`;

    return publicUrl;
  } catch (e) {
    console.error('S3 upload error:', e);
    throw e;
  }
}

module.exports = { uploadCover };
