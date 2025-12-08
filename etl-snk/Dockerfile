FROM node:20-alpine

# Instalar cron
RUN apk add --no-cache dcron

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

# Copia o arquivo de agendamento
COPY cronjob /etc/crontabs/root

ENV NODE_ENV=production

# Rodar cron em foreground (obrigatório para Docker)
CMD ["crond", "-f", "-l", "2"]
