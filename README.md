# Platform Cardápio

**Marca:** Platform Cardápio  
**Arquitetura:** FoodFlow AI  
**Integração:** módulo conectado aos clientes do [SaaS Platform](https://github.com/EmmanuelBonifacio/SaaSPlatformDev)

SaaS multi-tenant de cardápio digital, gestão de pedidos, CRM, fidelização, marketing, WhatsApp/IA e billing pré-pago (créditos por ciclo de 30 dias).

## Stack

| Camada | Tech |
|--------|------|
| Web | Next.js 15, TypeScript, Tailwind, shadcn/ui, Framer Motion |
| API | NestJS, Prisma 6, PostgreSQL, Redis, BullMQ |
| Infra | Docker, MinIO, Cloudflare/AWS (deploy) |

## Regra de crédito (oficial)

> O crédito de pedido **só é debitado quando o lojista ACEITA o pedido**.  
> Criar pedido (`PENDING`) ou rejeitar **não** consome crédito.

## Planos (seed)

| Plano | Preço | Limite / 30 dias |
|-------|-------|------------------|
| Iniciante | R$ 79,90 | 100 |
| Essencial | R$ 139,90 | 400 |
| Premium | R$ 249,90 | Ilimitado |

Pagamento Asaas: **fase final** (provider `manual` no Gestor por enquanto).

## Quick start

```bash
docker compose up -d
cp apps/api/.env.example apps/api/.env
# edite JWT_SECRET e secrets da ponte SaaS

cd apps/api
npm install
npx prisma migrate dev --name init
npm run prisma:seed
npm run start:dev

# outro terminal
cd apps/web
npm install
npm run dev -- -p 3011
```

- API: http://localhost:3010/api/health  
- Swagger: http://localhost:3010/docs  
- Web: http://localhost:3011  
- Cardápio demo: `/m/demo-burger`

### Logins seed

| Usuário | Senha | Papel |
|---------|-------|-------|
| `admin@platformcardapio.com` | `admin123_TROQUE` | SUPER_ADMIN |
| `loja@demo.com` | `loja123_TROQUE` | TENANT_OWNER |

## Ponte com SaaS Platform

| Endpoint | Uso |
|----------|-----|
| `POST /api/integrations/saas-platform/webhooks/provision` | Ativa estabelecimento quando o módulo é ligado no SaaS |
| `POST /api/integrations/saas-platform/sso` | Troca assinatura HMAC por JWT local |

Variáveis: `SAAS_PLATFORM_*` em `.env.example`.

Documentação completa: [`docs/`](./docs/).

## Módulos entregues (sem Asaas)

Painel: Pedidos, Cozinha/impressão, Cardápio, Marketing, CRM/LGPD, Relatórios+CSV, WhatsApp stub, Insights IA, Afiliados, Multi-loja, Push stub, Config (Pixel/GA/GTM).  
Público: cupom no checkout, tracking scripts, PWA+SW push handler, SEO, dark mode.  
Infra: Redis cache do menu, ThrottlerGuard (login 5/15min), webhooks com claim idempotente.

## Estrutura

```
apps/api     NestJS + Prisma
apps/web     Next.js painel + cardápio público
docs/        PRD, ERD, fluxos, roadmap, integração SaaS
docker-compose.yml
```

## Licença

Privado — Emmanuel Bonifacio / Platform Cardápio.
