# Estágio 1: Instala dependências
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
# Instala apenas as dependências de produção de forma limpa
RUN npm ci --omit=dev

COPY . .

# Estágio 2: Imagem final, mais enxuta
FROM node:20-alpine

WORKDIR /app

# Copia as dependências e o código do estágio anterior
COPY --from=builder /app .

# Expõe a porta que a API roda
EXPOSE 8080

# Comando para iniciar o servidor em produção
CMD ["node", "api/server.js"]