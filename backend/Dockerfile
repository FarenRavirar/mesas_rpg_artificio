# =============================================================================
# Backend — Anúncios de Mesas RPG
# Node.js API + AggregatorBot + CleanupWorker
# =============================================================================

# Estágio 1: build TypeScript
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src/ ./src/

RUN npm run build

# =============================================================================
# Estágio 2: imagem de produção (apenas o necessário)
FROM node:22-alpine AS production

WORKDIR /app

# Dependências de runtime do Sharp (processamento de imagem WebP)
RUN apk add --no-cache vips-dev fftw-dev build-base python3

COPY package*.json ./
RUN npm ci --omit=dev

# Copiar build compilado
COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/server.js"]
