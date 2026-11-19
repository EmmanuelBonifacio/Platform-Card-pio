# Roadmap — Platform Cardápio (FoodFlow AI)

## Fase 0 — Fundação (esta entrega)

- [x] Monorepo NestJS + Next.js + Prisma + Docker
- [x] Schema multi-tenant completo
- [x] Auth JWT + RBAC
- [x] Cardápio público + pedidos
- [x] Débito de crédito **no aceite** do lojista
- [x] Gestor (planos / checkout manual / trust release)
- [x] Ponte SaaS Platform (provision + SSO)
- [x] Seeds (planos Iniciante/Essencial/Premium + demo)

## Fase 1 — MVP operação

- [x] CRUD completo categorias/produtos/adicionais/combos (API + UI)
- [x] Kanban de pedidos (KDS visual básico)
- [x] Alertas saldo baixo / ciclo a vencer
- [ ] Subdomínio por tenant (Cloudflare DNS) — campo persistido; provisionamento pendente
- [x] Upload imagens (local + MinIO opcional)
- [x] Testes unitários aceite/crédito + smoke HTTP

## Fase 2 — Canais e marketing

- [x] WhatsApp config + webhook stub (Meta/Evolution real depois)
- [x] Cupons / campanhas / winback (API + painel + checkout)
- [x] Relatórios CSV + dashboard (últimos 30 dias)
- [x] Meta Pixel / GA / GTM no cardápio público
- [x] PWA (manifest + service worker shell)
- [x] Push notifications (subscribe API + SW handler; VAPID real depois)

## Fase 3 — CRM / fidelidade / IA

- [x] CRM segmentação + score
- [x] Cashback / pontos / selos / VIP no aceite
- [x] IA insights heurísticos (LLM pluggable depois)
- [x] Programa de indicações (links + click tracking)

## Fase 4 — Pagamentos e escala

- [ ] **Asaas** (PIX/cartão/boleto) — Gestor + opcional checkout cliente *(por último)*
- [x] Idempotência webhooks harden (claim processing + IntegrationEvent)
- [x] Redis cache menu público + rate limit fino (login/webhook + ThrottlerGuard)
- [ ] Observabilidade (logs, métricas) — Pino já no Nest; métricas depois
- [x] Hardening LGPD / auditoria (export + anonymize + audit log)

## Fase 5 — Premium UX

- [x] Dark mode + animações Framer
- [x] SEO cardápio público (`generateMetadata`)
- [x] Impressão cozinha (`/painel/cozinha`)
- [x] Multi-loja / redes (`StoreLocation` + painel)
