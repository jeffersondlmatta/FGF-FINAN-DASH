# Imagem base leve do Node
FROM node:22-alpine

# como escolher o nome diretorio?
WORKDIR /app

# Copia apenas os arquivos de dependência primeiro (melhora cache)
COPY package*.json ./

# Instala dependências (sem dev, pensando em produção)
RUN npm install --omit=dev

# Copia o restante do código
COPY . .

# o .env vai vai no container, e as credenciais como ficam? como e acessada?
ENV NODE_ENV=production

# Porta que o backend expõe
EXPOSE 3333

# Comando para subir o servidor eu uso npm run dev 
#"scripts": {
#    "dev": "nodemon src/server.js",
#    "start": "node src/server.js"
#  },
CMD ["npm", "start"]
# ou, se você roda direto:
# CMD ["node", "src/server.js"]
