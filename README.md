# Loja Strong Business School

E-commerce completo da loja oficial da Strong Business School: catálogo com grade de
tamanhos e cores, carrinho persistente, checkout com Pix, boleto e cartão, área do cliente
e área administrativa com controle de estoque.

---

## Como rodar

```bash
npm install
cp .env.example .env        # e preencha DATABASE_URL e AUTH_SECRET
npx prisma migrate deploy   # cria as tabelas no PostgreSQL
npm run db:seed             # popula catálogo, cupons e usuários de teste
npm run dev
```

A loja sobe em <http://localhost:3000>.

### Acessos de teste

| Perfil        | E-mail                 | Senha         | Onde entra                      |
| ------------- | ---------------------- | ------------- | ------------------------------- |
| Administrador | `admin@strong.com.br`  | `Strong@2026` | `/admin` — painel completo      |
| Cliente       | `aluno@exemplo.com`    | `Aluno@2026`  | `/conta` — pedidos e endereços  |

> Troque as duas senhas antes de qualquer ambiente que não seja a sua máquina.

---

## O que está pronto

**Vitrine**
Home com destaques e linhas, catálogo com filtros (linha, tamanho, preço, disponibilidade),
busca, ordenação e paginação, página de produto com galeria, seleção de variante, cálculo
de frete por CEP e produtos relacionados.

**Compra**
Carrinho no servidor (sobrevive ao fechar o navegador e se funde ao da conta no login),
cupons de desconto, cálculo de frete por região e peso, frete grátis acima de R$ 299,
checkout com endereço preenchido pelo CEP, escolha de modalidade de envio e meio de
pagamento.

**Pagamento**
Mercado Pago via Checkout Pro (Pix, boleto e cartão em até 12x), webhook de confirmação com
validação de assinatura, e um provedor de simulação para rodar o fluxo inteiro sem
credenciais.

**Conta e acesso**
Cadastro com confirmação de e-mail, "esqueci minha senha" com link de uso único, e troca de
senha que derruba as sessões abertas em outros aparelhos. Enquanto o e-mail não é
confirmado o cliente navega e monta o carrinho normalmente, mas não finaliza o pedido — é
por esse endereço que sai a confirmação da compra e o rastreio.

**Área do cliente**
Perfil, troca de senha, endereços salvos com padrão, histórico de pedidos e acompanhamento
com linha do tempo e código de rastreio.

**Área administrativa**
Painel com faturamento, ticket médio e alertas de reposição; CRUD de produtos com grade de
variantes e galeria; categorias; pedidos com mudança de status, rastreio, cancelamento com
devolução ao estoque e baixa manual de pagamento; controle de estoque com histórico de
movimentações; cupons; clientes com gestão de papel e ativação.

---

## Ligar o Mercado Pago

A loja nasce com `PAYMENT_PROVIDER=sandbox`, que simula a aprovação numa tela interna. Para
cobrar de verdade:

1. Pegue as credenciais em <https://www.mercadopago.com.br/developers/panel> e preencha o
   `.env`:

   ```ini
   PAYMENT_PROVIDER="mercadopago"
   MP_ACCESS_TOKEN="APP_USR-..."
   NEXT_PUBLIC_MP_PUBLIC_KEY="APP_USR-..."
   MP_WEBHOOK_SECRET="..."
   NEXT_PUBLIC_SITE_URL="https://loja.strong.com.br"
   ```

2. No painel do Mercado Pago, em **Suas integrações → Webhooks**, cadastre a URL
   `https://SEU-DOMINIO/api/webhooks/mercadopago` e marque o evento **Pagamentos**. Copie a
   chave secreta gerada para `MP_WEBHOOK_SECRET`.

3. Para testar localmente, exponha a porta 3000 com um túnel (`ngrok http 3000`) e use a URL
   pública nas duas variáveis.

Sem `MP_ACCESS_TOKEN` a loja cai automaticamente na simulação em vez de quebrar o checkout.

### Trocar de adquirente

Todo o checkout conversa com a interface `PaymentProvider` (`src/lib/payments/types.ts`).
Para usar Pagar.me, Asaas ou Stripe, escreva um arquivo novo em `src/lib/payments/`
implementando `createCheckout` e `fetchStatus`, registre-o em `src/lib/payments/index.ts` e
aponte `PAYMENT_PROVIDER`. Nenhuma tela precisa mudar.

---

## E-mails da conta

Confirmação de cadastro e redefinição de senha usam a mesma mecânica: um segredo aleatório
que só existe dentro do e-mail, do qual o banco guarda apenas o SHA-256 (`AuthToken`). Um
dump do banco não permite assumir conta nenhuma. O link de confirmação vale 24 horas, o de
redefinição vale 1 hora, e emitir um novo invalida o anterior.

Os dois links abrem uma página com um botão, em vez de agir direto no GET. O motivo é
prático: filtros como o Safe Links do Microsoft 365 abrem os endereços das mensagens para
escaneá-las, e queimariam o token antes de o cliente clicar.

Sem `SMTP_HOST` configurado nada é enviado — o `mailer` só registra a mensagem no console,
o que é suficiente para testar o fluxo localmente: o link aparece no terminal.

---

## Banco de dados

A loja roda em PostgreSQL, via o adapter `@prisma/adapter-pg` (o Prisma 7 exige
um driver adapter explícito, ver `src/lib/prisma.ts`). Basta um `DATABASE_URL`
apontando para o servidor e `npx prisma migrate deploy` para criar as tabelas.

Os enums são strings validadas em `src/lib/enums.ts`, não tipos `enum` do banco:
acrescentar um status novo não exige migration. Em compensação, buscas por texto
precisam de `mode: 'insensitive'` explícito — o `ILIKE` do Postgres diferencia
caixa, ao contrário do `LIKE` do SQLite usado até então.

---

## Estrutura

```
prisma/
  schema.prisma          modelo de dados
  seed.ts                catálogo inicial, cupons e usuários
scripts/
  gerar-imagens.mjs      gera os mockups vetoriais dos produtos
  fluxo-compra.mjs       teste de fumaça do fluxo de compra num navegador real
  capturar.mjs           screenshots das telas, com login opcional
src/
  app/
    (loja)/              vitrine, carrinho, checkout, pedido, conta
    (auth)/              entrar e criar conta
    admin/               área administrativa
    actions/             Server Actions, agrupadas por domínio
    api/                 cotação de frete e webhook do Mercado Pago
  components/            UI por área (loja, conta, admin, marca)
  lib/                   regras de negócio: pedidos, carrinho, frete, cupons, pagamentos
  proxy.ts               bloqueio otimista das rotas privadas
```

### Onde ficam as regras

Preço, frete e desconto são recalculados no servidor em `src/lib/orders.ts` no momento de
fechar o pedido. O que o navegador envia define endereço, modalidade de entrega e meio de
pagamento — nunca quanto o cliente paga.

O estoque é reservado na criação do pedido, com `updateMany` condicionado à quantidade
disponível: se duas pessoas disputarem a última peça, a transação da segunda é desfeita
inteira. Cancelamento devolve as unidades e registra a movimentação.

---

## Scripts

| Comando                | O que faz                                                   |
| ---------------------- | ----------------------------------------------------------- |
| `npm run dev`          | Servidor de desenvolvimento                                 |
| `npm run build`        | Build de produção (roda a checagem de tipos)                 |
| `npm start`            | Serve o build                                               |
| `npm run lint`         | ESLint                                                      |
| `npm run db:migrate`   | Cria e aplica migrações                                     |
| `npm run db:seed`      | Popula o banco (seguro rodar de novo)                       |
| `npm run db:studio`    | Prisma Studio, para inspecionar os dados                    |
| `npm run db:reset`     | Zera o banco e recria do zero                               |
| `npm run imagens`      | Regenera os mockups em `public/produtos`                    |
| `npm run logo`         | Deriva a variante azul do logotipo a partir da versão branca |
| `npm run acentos`      | Verifica e repara acentuação corrompida por editor ou script |
| `npm run teste:compra` | Percorre a compra inteira num navegador real                |
| `npm run teste:limpar` | Apaga as contas criadas pelo teste e devolve o estoque       |

O teste de compra e as capturas precisam do `npm run dev` rodando em outro terminal e do
navegador do Playwright baixado uma vez: `npx playwright install chromium`.

> **Nota para quem editar no Windows:** o PowerShell 5.1 lê arquivos UTF-8 sem BOM usando a
> codepage do sistema, o que corrompe acentos ao regravar. Se usar `Get-Content`/`Set-Content`
> para editar em lote, rode `npm run acentos` depois para conferir.

---

## Identidade visual

A paleta vem do logotipo da escola: **azul `#074784`** e **âmbar `#fab644`**. O azul
carrega a estrutura; o âmbar aparece onde há ação ou destaque, na mesma proporção em que
aparece na assinatura. Verde e vermelho existem só como cores de sistema — aprovado,
esgotado, erro — e nunca como cor de marca. Os tokens estão em `src/app/globals.css`, no
bloco `@theme`.

O design usa gradiente, profundidade e movimento: campo em degradê com focos de luz no
herói e no rodapé, peça em destaque suspensa em 3D com halo, cards que se inclinam ao
receber o ponteiro, revelação em cascata conforme a página rola e brilho que atravessa os
botões principais. Tudo isso desliga sozinho para quem tem `prefers-reduced-motion`
ativado, e o conteúdo continua visível mesmo sem JavaScript.

### Logotipo

`public/logo-strong-white.png` é o arquivo oficial (versão branca, para fundo escuro).
A variante azul para fundo claro é derivada dele:

```bash
npm run logo    # gera public/logo-strong.png
```

O componente `Logo` escolhe a variante pelo `tone`, então trocar o arquivo oficial e rodar
o comando atualiza a marca em toda a loja.

## Imagens dos produtos

As imagens em `public/produtos` são mockups vetoriais gerados por
`scripts/gerar-imagens.mjs` — cada categoria tem um desenho próprio que aceita a cor da
variante, com fundo transparente para funcionar tanto sobre o papel claro do catálogo
quanto sobre o azul profundo do herói. Servem para a loja abrir com um catálogo
apresentável antes das fotos de estúdio.

Quando as fotos reais chegarem, suba os arquivos em `public/produtos` (ou aponte para um
CDN) e escolha as novas imagens na tela de edição do produto. A listagem que alimenta essa
tela está em `src/lib/media.ts` — é o único ponto a trocar para plugar um serviço de upload
como S3 ou Cloudinary.

---

## Antes de publicar

- [ ] Gerar um `AUTH_SECRET` novo: `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`
- [ ] Trocar as senhas de `admin@strong.com.br` e remover o usuário de teste
- [ ] Migrar para PostgreSQL e configurar backup
- [ ] Preencher as credenciais do Mercado Pago e cadastrar o webhook
- [ ] Apontar `NEXT_PUBLIC_SITE_URL` para o domínio real
- [ ] Revisar os textos da central de ajuda em `src/app/(loja)/ajuda/[slug]/page.tsx`
      (prazos, canais de contato e política de troca precisam bater com a operação real)
- [ ] Definir o e-mail transacional de confirmação de pedido — hoje a loja avisa o cliente
      apenas pela página do pedido
