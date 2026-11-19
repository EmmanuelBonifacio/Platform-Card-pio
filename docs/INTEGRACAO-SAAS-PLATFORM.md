# Integração — Platform Cardápio ↔ SaaS Platform

## Objetivo

Cada cliente do **SaaS Platform** (`SaaSPlatformDev`) pode ativar o módulo **Platform Cardápio** sem criar conta do zero. O estabelecimento é provisionado aqui e o lojista entra via SSO.

## Fluxo de provisionamento

```
Admin SaaS ativa módulo "cardapio" no tenant
        │
        ▼
SaaS Platform POST webhook (HMAC)
  /api/integrations/saas-platform/webhooks/provision
        │
        ▼
Platform Cardápio cria/atualiza:
  - Tenant (saasTenantId, slug)
  - User owner (saasUserId)
  - Subscription + CreditCycle trial
```

### Payload

```json
{
  "saasTenantId": "uuid-do-tenant-no-saas",
  "saasSlug": "acme",
  "name": "Acme Burger",
  "ownerEmail": "dono@acme.com",
  "ownerName": "Dono Acme",
  "saasUserId": "uuid-user-saas",
  "planCode": "iniciante"
}
```

Header: `x-saas-signature: sha256=<hmac_hex>`  
HMAC-SHA256 do **body bruto** com `SAAS_PLATFORM_WEBHOOK_SECRET`.

## SSO

```
Painel SaaS → botão "Abrir Cardápio"
        │
        ▼
POST /api/integrations/saas-platform/sso
{
  "saasUserId", "saasTenantId", "email", "name",
  "timestamp": 1730000000000,
  "signature": "hmac(saasUserId:saasTenantId:email:timestamp)"
}
        │
        ▼
JWT Platform Cardápio (15m)
```

Secret: `SAAS_PLATFORM_SHARED_SECRET` (≥ 32 chars).

## Débito de crédito

Alinhado ao produto: **somente no aceite do lojista** (`POST /api/orders/:id/accept`).

## Asaas

Adiado para fase final — mesma conta/gateway poderá servir SaaS Platform + Platform Cardápio + outros sistemas. Até lá, Gestor usa `provider=manual`.

## Checklist no SaaS Platform

1. Módulo `cardapio` no catálogo `modules`
2. Job/webhook ao ativar `TenantModule`
3. Tela/atalho SSO no painel do tenant
4. Secrets espelhados nos dois `.env`
