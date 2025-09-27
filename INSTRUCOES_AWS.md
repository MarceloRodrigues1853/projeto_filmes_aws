# Instruções de Configuração AWS ☁️

Este documento descreve os passos usados para configurar os serviços da AWS.

---

## 1) Amazon S3 (Armazenamento de Imagens)

- Criado bucket chamado **filmes-app-bucket**.
- Configurações:
  - Bloquear acesso público.
  - Habilitar CORS para aceitar `PUT` e `GET` do frontend.
- No backend, configurado **aws-sdk** para upload:
  - `AWS_ACCESS_KEY_ID` e `AWS_SECRET_ACCESS_KEY` (usuário IAM).
  - `AWS_REGION=sa-east-1`.
  - Nome do bucket em variável de ambiente.

---

## 2) Amazon RDS (Banco de Dados MySQL)

- Criada instância RDS com:
  - Engine: MySQL 8.0.
  - Database inicial: `filmes`.
  - Usuário administrador e senha fortes.
- Configurado **Security Group**:
  - Liberação da porta **3306** apenas para o servidor/backend.
- Importado `schema.sql` e `data.sql` para inicializar as tabelas.

---

## 3) AWS IAM (Controle de Acesso)

- Criado usuário IAM específico para o sistema.
- Permissões mínimas:
  - `AmazonS3FullAccess` (restrito ao bucket do projeto).
- Chaves de acesso configuradas no backend (`.env`).

---

## 4) Integração Backend

- `.env` do backend contém:

  ```env
  DB_HOST=<endpoint-do-rds>
  DB_PORT=3306
  DB_USER=<usuario>
  DB_PASS=<senha>
  DB_NAME=filmes

  JWT_SECRET=<chave-secreta>

  AWS_REGION=sa-east-1
  AWS_ACCESS_KEY_ID=<sua-chave>
  AWS_SECRET_ACCESS_KEY=<sua-chave-secreta>
  S3_BUCKET=filmes-app-bucket
  ```
