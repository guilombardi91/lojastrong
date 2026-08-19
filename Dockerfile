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
# então precisam existir agora. O EasyPanel deriva os --build-arg das
# variáveis cadastradas no painel do serviço: o que não estiver lá chega
# aqui como string vazia, não como ausente.
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_MP_PUBLIC_KEY
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_MP_PUBLIC_KEY=$NEXT_PUBLIC_MP_PUBLIC_KEY

# Vazio não quebra mais o build (o código cai para localhost), e é justamente
# por isso que precisa gritar: o bundle sairia com http://localhost:3000 no
# retorno do checkout e nos links dos e-mails, sem nenhum erro visível.
RUN if [ -z "$NEXT_PUBLIC_SITE_URL" ]; then \
      echo '################################################################'; \
      echo '# AVISO: NEXT_PUBLIC_SITE_URL vazio.'; \
      echo '# O bundle usará http://localhost:3000 e o checkout não voltará'; \
      echo '# para a loja. Cadastre a variável no painel do EasyPanel.'; \
      echo '################################################################'; \
    fi

# DATABASE_URL de propósito NÃO é um ARG: nada aqui precisa da credencial real.
# O SiteHeader lê cookies, o que torna dinâmica toda a árvore da loja, então
# nenhuma página é pré-renderizada no build; o `prisma generate` só exige uma
# URL sintaticamente válida, e este literal serve. Declarar um ARG aqui daria
# ao EasyPanel motivo para injetar a senha do banco no comando de build — que
# ele imprime em texto claro no log. A URL real chega apenas em runtime.
ENV DATABASE_URL="postgresql://build:build@127.0.0.1:5432/build"

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
