# =============================================================================
# Frontend — Anúncios de Mesas RPG
# React + Vite → build estático servido por Nginx
# =============================================================================

# Estágio 1: build Vite
FROM node:22-alpine AS builder

WORKDIR /app

ARG VITE_ENABLE_DEVTOOLS=false
ENV VITE_ENABLE_DEVTOOLS=${VITE_ENABLE_DEVTOOLS}

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build

# =============================================================================
# Estágio 2: Nginx servindo o build estático
FROM nginx:alpine AS production

# Remover config padrão do Nginx
RUN rm /etc/nginx/conf.d/default.conf

# Copiar config customizada (proxy para a API com substituição de ENV)
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Copiar build do Vite
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
