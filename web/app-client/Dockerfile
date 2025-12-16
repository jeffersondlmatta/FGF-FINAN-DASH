# ----------------------------
# Build stage
# ----------------------------
FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .
RUN npm run build

# ----------------------------
# Runtime stage (NGINX)
# ----------------------------
FROM nginx:alpine

# Remove config default
RUN rm /etc/nginx/conf.d/default.conf

# Config SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Arquivos buildados
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
