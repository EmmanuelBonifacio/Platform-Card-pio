# Casos de uso principais

## UC01 — Cliente faz pedido no cardápio

1. Abre `/m/{slug}`
2. Monta carrinho e confirma
3. API cria `Order` com status `PENDING`
4. **Não** consome crédito

## UC02 — Lojista aceita pedido

1. Vê pedido no painel
2. Clica Aceitar → `POST /api/orders/:id/accept`
3. Sistema valida ciclo/saldo (ou trust release)
4. Debita 1 crédito atomicamente
5. Status → `ACCEPTED`

## UC03 — Créditos esgotados

1. Lojista tenta aceitar
2. API responde `CARDAPIO_CREDITS_EXHAUSTED`
3. Gestor oferece recarga / troca de plano

## UC04 — Recarga (Gestor)

1. Escolhe plano + PIX/cartão/boleto
2. Hoje: `provider=manual` confirma na hora
3. Futuro: Asaas + webhook
4. Novo ciclo 30 dias, `consumed=0`

## UC05 — Liberação em confiança

1. Super admin autoriza N horas / pedidos extra
2. Tenant `TRUST_RELEASE` opera sem saldo
3. Expira → bloqueio até recarga

## UC06 — Ativação via SaaS Platform

1. Módulo cardápio ligado no SaaS
2. Webhook provisiona Tenant + trial
3. SSO abre o painel Platform Cardápio
