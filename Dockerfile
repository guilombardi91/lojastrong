# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS builder
WORKDIR /app

# python3/make/g++: fallback compiler toolchain for better-sqlite3 caso o
# prebuild-install não encontre um binário pronto para a plataforma do build.
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ openssl \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Variáveis NEXT_PUBLIC_* são embutidas no bundle do cliente durante o build,
# então precisam existir agora (passe como --build-arg no EasyPanel).
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_MP_PUBLIC_KEY
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_MP_PUBLIC_KEY=$NEXT_PUBLIC_MP_PUBLIC_KEY

# DATABASE_URL só precisa apontar para um arquivo válido durante `next build`
# (nenhuma query roda nesse momento); o valor real de produção é passado em
# runtime pelo EasyPanel.
ENV DATABASE_URL="file:./dev.db"

RUN npx prisma generate

# `next build` executa generateStaticParams (produtos/categorias/ajuda), que
# consulta o banco via Prisma — sem as tabelas criadas o build quebra com
# "no such table". Aplicamos as migrations nesse dev.db descartável só para
# isso; o banco de verdade em produção é o do volume montado em /app/data.
RUN npx prisma migrate deploy
RUN npm run build

# Remove devDependencies (typescript, tailwind, eslint, playwright...) do
# node_modules já usado no build, sem precisar de um segundo `npm ci`.
RUN npm prune --omit=dev


FROM node:22-bookworm-slim AS runner
WORKDIR /app

# openssl: exigido em runtime pelos engines do Prisma.
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/* \
  && groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY docker-entrypoint.sh ./docker-entrypoint.sh

# /app/data (banco SQLite) e /app/public/uploads/produtos (fotos enviadas
# pelo admin) devem ser volumes persistentes no EasyPanel — sem isso, tudo
# se perde a cada novo deploy do container.
RUN chmod +x docker-entrypoint.sh \
  && mkdir -p /app/data /app/public/uploads/produtos \
  && chown -R nextjs:nodejs /app

USER nextjs
EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["npm", "start"]
