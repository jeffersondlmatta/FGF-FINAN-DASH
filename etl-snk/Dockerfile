FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ENV NODE_ENV=production

# roda o ETL (ajuste o caminho se for diferente)
CMD ["node", "src/index.js"]
