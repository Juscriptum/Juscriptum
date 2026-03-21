# API Examples

## Status Of This File

- Scope: illustrative examples only
- Authority level: not a contract reference
- Safe use: rough mental model for common flows

Do not treat these examples as exact current request or response shapes.

## Why This File Is Limited

- The older version mixed historical “before/after” audit snippets with runtime examples.
- Some examples used `/api/...`, which is a proxy path convention, not the direct backend route prefix.
- Current DTOs, guards, and response bodies can differ from the earlier examples.

## Current Contract Sources Instead

For current behavior, prefer:

- controllers in `src/**/controllers`
- DTOs in `src/**/dto`
- entities/services when the response is assembled there
- the direct backend prefix `/v1`

If the frontend is making the request through Vite/nginx, `/api` may still appear as the proxy entrypoint, but the backend itself serves `/v1`.

## Representative Example Categories

- auth and session flows
- client, case, and document CRUD
- billing/provider callback flows
- trust-verification callback intake
- health and readiness endpoints

## Minimal Illustrative Examples

### Direct backend health check

```http
GET /health
```

### Direct backend API request

```http
GET /v1/clients?page=1&limit=20
Authorization: Bearer <token>
```

### Frontend proxy request to the same backend route

```http
GET /api/clients?page=1&limit=20
Authorization: Bearer <token>
```

### Trust-provider callback shape category

```http
POST /v1/trust-verification/providers/:provider/callback
X-Provider-Signature: ...
X-Provider-Timestamp: ...
X-Provider-Nonce: ...
Content-Type: application/json
```

### Billing webhook category

```http
POST /v1/billing/webhooks/stripe
Stripe-Signature: ...
Content-Type: application/json
```

## Practical Rule

When in doubt, update the code-facing docs or inspect the controller/DTO path instead of expanding this file into a fake “source of truth”.
