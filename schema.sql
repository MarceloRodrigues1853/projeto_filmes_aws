-- Cria o schema e usa
CREATE DATABASE IF NOT EXISTS filmes
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE filmes;

-- Tabela: usuarios
CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  senha_hash VARCHAR(255) NOT NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Tabela: filmes
CREATE TABLE IF NOT EXISTS filmes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(200) NOT NULL,
  genero VARCHAR(80),
  diretor VARCHAR(120),
  imagem_s3_url VARCHAR(500),
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Tabela: avaliacoes (ENTIDADE ASSOCIATIVA COM PK COMPOSTA)
-- padrão EER acadêmico (identifying): PK = (usuario_id, filme_id)
CREATE TABLE IF NOT EXISTS avaliacoes (
  usuario_id INT NOT NULL,
  filme_id   INT NOT NULL,
  nota       TINYINT NOT NULL,
  criado_em  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_avaliacoes PRIMARY KEY (usuario_id, filme_id),
  CONSTRAINT fk_av_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  CONSTRAINT fk_av_filme   FOREIGN KEY (filme_id)  REFERENCES filmes(id)  ON DELETE CASCADE,
  CONSTRAINT chk_nota CHECK (nota BETWEEN 1 AND 5)
) ENGINE=InnoDB;

-- Índices úteis (opcionais)
-- Em 'avaliacoes' a PK já cobre (usuario_id,filme_id) -> índice adicional não é necessário
-- Em 'filmes' um índice por genero ajuda filtros
DROP INDEX IF EXISTS idx_filmes_genero ON filmes;
CREATE INDEX idx_filmes_genero ON filmes (genero);
