FROM node:22-alpine

# Timezone + cron
RUN apk add --no-cache dcron tzdata \
 && cp /usr/share/zoneinfo/America/Sao_Paulo /etc/localtime \
 && echo "America/Sao_Paulo" > /etc/timezone

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install --omit=dev


COPY src ./src
COPY cronjob /etc/crontabs/root

ENV NODE_ENV=production

# Cron em foreground
CMD ["crond", "-f", "-l", "2"]
