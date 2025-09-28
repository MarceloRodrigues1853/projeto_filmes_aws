// backend/api/services/s3.service.js
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: process.env.AWS_ACCESS_KEY_ID
    ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      }
    : undefined,
});

async function uploadToS3({ Bucket, Key, Body, ContentType }) {
  await s3.send(new PutObjectCommand({ Bucket, Key, Body, ContentType }));
  return `https://${Bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${Key}`;
}

module.exports = { s3, uploadToS3 };
