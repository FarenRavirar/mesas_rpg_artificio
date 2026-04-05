# =============================================================================
# Backend — Anúncios de Mesas RPG
# Node.js API + AggregatorBot + CleanupWorker
# =============================================================================

# Estágio 1: build TypeScript
FROM node:22-alpine AS builder

WORKDIR /app

COPY backend/package*.json ./
RUN npm ci

COPY backend/tsconfig.json ./
COPY backend/src/ ./src/
COPY docs/taxonomia/arvores_de_sistemas.md ./arvores_de_sistemas.md

RUN npm run build

# =============================================================================
# Estágio 2: imagem de produção (apenas o necessário)
FROM node:22-alpine AS production

WORKDIR /app

# Dependências de runtime do Sharp (processamento de imagem WebP)
# + Python3 e pip para parser de mensagens do Discord
RUN apk add --no-cache vips-dev fftw-dev build-base python3 py3-pip

# Copiar e instalar dependências Python
COPY backend/requirements.txt ./
RUN pip3 install --no-cache-dir --break-system-packages -r requirements.txt && \
    pip3 install --no-cache-dir --break-system-packages https://github.com/explosion/spacy-models/releases/download/pt_core_news_lg-3.8.0/pt_core_news_lg-3.8.0-py3-none-any.whl

COPY backend/package*.json ./
RUN npm ci --omit=dev

# Copiar build compilado
COPY --from=builder /app/dist ./dist

# Copiar arquivos de dados de sistemas e cenários (JSON)
# COPY --from=builder /app/sistemas.json ./sistemas.json
# COPY --from=builder /app/cenarios.json ./cenarios.json
# TODO: Descomentar após recebimento dos arquivos sistemas.json e cenarios.json


# Copiar scripts Python do parser (necessário para pythonParserService)
COPY backend/src/services/aggregator/parser ./dist/services/aggregator/parser

EXPOSE 3000

CMD ["node", "dist/server.js"]
