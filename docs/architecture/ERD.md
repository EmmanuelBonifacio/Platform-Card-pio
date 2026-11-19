# Diagrama de entidades (resumo)

```
Tenant 1──* User
Tenant 1──* Customer
Tenant 1──* Category 1──* Product *──* Addon
Tenant 1──* Combo *──* Product
Tenant 1──* Order *──o Customer
Tenant 1──1 Subscription *──1 Plan
Tenant 1──* CreditCycle *──o PlatformPayment
Order *──o CreditCycle   (preenchido no ACEITE)
Customer 1──o LoyaltyAccount
Tenant 1──* Coupon / Campaign / AffiliateLink / AuditLog
```

## Fluxo de crédito

```
Cliente cria Order(PENDING)     → creditDebited=false
Lojista REJECT                  → sem débito
Lojista ACCEPT                  → UPDATE credit_cycles.consumed+1 (atômico)
                                  Order.creditDebited=true
                                  Order.creditCycleId=...
```
