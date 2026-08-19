# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS builder
WORKDIR /app

# openssl: exigido pelos engines do Prisma.
# python3/make/g++: o pacote `prisma` declara better-sqlite3 como peerDependency
# opcional, então o `npm ci` ainda o baixa mesmo sem o adapter de SQLite. Ele
# tem install script e cai no node-gyp quando o prebuild-install não encontra
# um binário pronto para a plataforma — sem a toolchain, o build fica na sorte.
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

# O build não precisa de um Postgres de pé: os generateStaticParams de
# produtos/[slug] e categorias/[slug] caem para lista vazia quando a conexão
# falha, e essas rotas passam a ser geradas sob demanda. Passar a URL real
# como --build-arg é opcional, e só serve para adiantar esses params aqui.
# A URL que importa é a de runtime, injetada pelo EasyPanel.
ARG DATABASE_URL="postgresql://build:build@127.0.0.1:5432/build"
ENV DATABASE_URL=$DATABASE_URL

RUN npx prisma generate
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

# O banco agora é um Postgres externo, mas /app/public/uploads/produtos (as
# fotos que o admin envia) continua precisando ser um volume persistente no
# EasyPanel — sem isso, as imagens somem a cada novo deploy do container.
RUN chmod +x docker-entrypoint.sh \
  && mkdir -p /app/public/uploads/produtos \
  && chown -R nextjs:nodejs /app

USER nextjs
EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["npm", "start"]
