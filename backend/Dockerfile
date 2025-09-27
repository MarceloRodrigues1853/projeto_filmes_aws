FROM node:20-alpine@sha256:secure-digest-placeholder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 8080
CMD ["npm", "run", "dev"]
