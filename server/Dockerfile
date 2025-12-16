FROM node:22-alpine

# Timezone (importante para logs, datas e banco)
RUN apk add --no-cache tzdata \
 && cp /usr/share/zoneinfo/America/Sao_Paulo /etc/localtime \
 && echo "America/Sao_Paulo" > /etc/timezone

WORKDIR /app

# Dependências primeiro (cache eficiente)
COPY package.json package-lock.json ./
RUN npm install --omit=dev

# Código do servidor
COPY src ./src

# Se o front já estiver buildado e quiser servir pela API
# COPY web/dist ./web/dist

ENV NODE_ENV=production
ENV PORT=3333

EXPOSE 3333

CMD ["node", "src/server.js"]
