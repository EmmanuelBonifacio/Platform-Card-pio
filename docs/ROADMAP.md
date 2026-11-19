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

- [ ] CRUD completo categorias/produtos/adicionais/combos (API + UI)
- [ ] Kanban de pedidos + KDS
- [ ] Alertas saldo baixo / ciclo a vencer
- [ ] Subdomínio por tenant (Cloudflare)
- [ ] Upload imagens (MinIO)
- [ ] Testes e2e aceite/crédito

## Fase 2 — Canais e marketing

- [ ] WhatsApp bot + fila BullMQ
- [ ] Cupons / campanhas / winback
- [ ] Relatórios CSV/PDF + dashboard live
- [ ] Meta Pixel / GA / GTM no cardápio público
- [ ] PWA + push

## Fase 3 — CRM / fidelidade / IA

- [ ] CRM segmentação + score
- [ ] Cashback / pontos / selos / VIP
- [ ] IA atendimento / upsell / insights
- [ ] Programa de indicações

## Fase 4 — Pagamentos e escala

- [ ] **Asaas** (PIX/cartão/boleto) — Gestor + opcional checkout cliente
- [ ] Idempotência webhooks harden
- [ ] Redis cache / rate limit fino
- [ ] Observabilidade (logs, métricas)
- [ ] Hardening LGPD / auditoria

## Fase 5 — Premium UX

- [ ] Dark mode + animações Framer
- [ ] SEO cardápio público
- [ ] Impressão automática cozinha
- [ ] Multi-loja / redes
