# LAW ORGANIZER - Auth API Documentation

## Base URL
```
Production: https://api.laworganizer.ua/v1
Staging: https://staging-api.laworganizer.ua/v1
Local: http://localhost:3000/v1
```

## Authentication
All protected endpoints require Bearer token in header:
```
Authorization: Bearer <access_token>
```

---

## Endpoints

### Commercial Workflow Notes (2026-03-10)

- `POST /invoices/:id/pdf` now generates a stored PDF artifact through the active storage provider and persists `pdfUrl` plus `pdfGeneratedAt` on the invoice.
- `POST /invoices/:id/send` now ensures a PDF exists, queues an email notification for the client, and moves the invoice status to `sent`.
- Notification delivery is no longer stub-only: queued notifications are processed asynchronously in-app and transition through `queued`, `delivered`, or `failed`.
- Event reminders are delivered through the same notification pipeline once the reminder window is reached.

### 1. Organization Registration

**POST** `/organizations/register`

Register new organization with admin user.

**Request Body:**
```json
{
  "name": "Юридична фірма 'Професіонал'",
  "legalForm": "llc",
  "edrpou": "12345678",
  "taxNumber": "123456789012",
  "address": "вул. Хрещатик, 1",
  "city": "Київ",
  "region": "Київська область",
  "phone": "+380441234567",
  "email": "admin@lawfirm.ua",
  "website": "https://lawfirm.ua",
  "subscriptionPlan": "professional",
  "firstName": "Іван",
  "lastName": "Петренко",
  "patronymic": "Іванович",
  "password": "P@ssw0rd123!",
  "position": "Директор",
  "barNumber": "123456789012"
}
```

**Response (201):**
```json
{
  "organizationId": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "660e8400-e29b-41d4-a716-446655440001"
}
```

**Validation Errors (400):**
```json
{
  "statusCode": 400,
  "message": [
    "email must be an email",
    "Password too weak"
  ],
  "error": "Bad Request"
}
```

---

### 2. Login

**POST** `/auth/login`

Authenticate user and get tokens.

**Request Body:**
```json
{
  "email": "admin@lawfirm.ua",
  "password": "P@ssw0rd123!",
  "mfaCode": "123456"
}
```

**Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 900,
  "user": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "email": "admin@lawfirm.ua",
    "firstName": "Іван",
    "lastName": "Петренко",
    "role": "organization_owner",
    "tenantId": "550e8400-e29b-41d4-a716-446655440000",
    "emailVerified": true,
    "mfaEnabled": true
  },
  "organization": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Юридична фірма 'Професіонал'",
    "subscriptionPlan": "professional",
    "subscriptionStatus": "trialing",
    "trialEndAt": "2025-02-28T00:00:00.000Z"
  }
}
```

**Error (401):**
```json
{
  "statusCode": 401,
  "message": "Невірний email або пароль",
  "error": "Unauthorized"
}
```

---

### 3. Refresh Token

**POST** `/auth/refresh`

Refresh access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 900
}
```

---

### 4. Logout

**POST** `/auth/logout`

Logout from current device.

**Request Body (optional):**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "deviceInfo": {
    "device": "iPhone",
    "os": "iOS 15.0"
  }
}
```

**Response (204):** No content

---

### 5. Logout All Devices

**POST** `/auth/logout-all`

Logout from all devices.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (204):** No content

---

### 6. Forgot Password

**POST** `/auth/forgot-password`

Request password reset email.

**Request Body:**
```json
{
  "email": "admin@lawfirm.ua"
}
```

**Response (204):** No content

**Note:** Always returns 204 to prevent email enumeration.

---

### 7. Reset Password

**POST** `/auth/reset-password`

Reset password using token from email.

**Request Body:**
```json
{
  "token": "abc123def456",
  "newPassword": "NewP@ssw0rd123!"
}
```

**Response (204):** No content

---

### 8. Verify Email

**POST** `/auth/verify-email`

Verify email address using token from email.

**Request Body:**
```json
{
  "token": "abc123def456"
}
```

**Response (204):** No content

---

### 9. Get Current User

**GET** `/auth/me`

Get current authenticated user info.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "user_id": "660e8400-e29b-41d4-a716-446655440001",
  "tenant_id": "550e8400-e29b-41d4-a716-446655440000",
  "role": "organization_owner",
  "subscription_plan": "professional",
  "email": "admin@lawfirm.ua"
}
```

---

### 10. Get Organization

**GET** `/organizations/me`

Get current organization info.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Юридична фірма 'Професіонал'",
  "legalForm": "llc",
  "edrpou": "12345678",
  "taxNumber": "123456789012",
  "address": "вул. Хрещатик, 1",
  "city": "Київ",
  "region": "Київська область",
  "phone": "+380441234567",
  "email": "admin@lawfirm.ua",
  "website": "https://lawfirm.ua",
  "subscriptionPlan": "professional",
  "subscriptionStatus": "trialing",
  "trialEndAt": "2025-02-28T00:00:00.000Z",
  "maxUsers": 5,
  "status": "active",
  "createdAt": "2025-02-14T10:00:00.000Z",
  "updatedAt": "2025-02-14T10:00:00.000Z"
}
```

---

### 11. Get Subscription

**GET** `/organizations/subscription`

Get subscription status.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440002",
  "tenantId": "550e8400-e29b-41d4-a716-446655440000",
  "provider": "wayforpay",
  "externalId": "CUSTOMER_123",
  "subscriptionExternalId": "SUB_456",
  "plan": "professional",
  "status": "trialing",
  "trialStartAt": "2025-02-14T10:00:00.000Z",
  "trialEndAt": "2025-02-28T00:00:00.000Z",
  "currentPeriodStartAt": "2025-02-14T10:00:00.000Z",
  "currentPeriodEndAt": "2025-02-28T00:00:00.000Z",
  "amountCents": 9900,
  "currency": "UAH",
  "createdAt": "2025-02-14T10:00:00.000Z",
  "updatedAt": "2025-02-14T10:00:00.000Z"
}
```

---

### 12. Get Onboarding Progress

**GET** `/organizations/onboarding`

Get onboarding completion status.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "completed": false,
  "percentage": 60,
  "steps": [
    {
      "step": "organization_details",
      "completed": true,
      "completedAt": "2025-02-14T10:30:00.000Z"
    },
    {
      "step": "user_profile",
      "completed": true,
      "completedAt": "2025-02-14T10:31:00.000Z"
    },
    {
      "step": "subscription_setup",
      "completed": true,
      "completedAt": "2025-02-14T10:32:00.000Z"
    },
    {
      "step": "team_invitation",
      "completed": false,
      "completedAt": null
    },
    {
      "step": "first_case_created",
      "completed": false,
      "completedAt": null
    }
  ]
}
```

---

### 12a. Get Billing Invoices

**GET** `/billing/invoices`

Get normalized billing invoices for the current tenant.

Behavior:

- Stripe subscriptions return provider-backed invoice data.
- WayForPay subscriptions return normalized invoice history based on accepted webhook/payment state.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
[
  {
    "id": "in_123",
    "number": "INV-123",
    "amount": 2999,
    "currency": "USD",
    "status": "paid",
    "dueDate": "2025-02-28T00:00:00.000Z",
    "paidAt": "2025-02-28T00:00:00.000Z",
    "pdfUrl": "https://billing.stripe.com/invoice/abc",
    "provider": "stripe"
  }
]
```

---

### 12b. Get Billing Payment Methods

**GET** `/billing/payment-methods`

Get normalized payment methods for the current tenant.

Behavior:

- Stripe subscriptions return provider-backed customer payment methods.
- WayForPay subscriptions return the latest known card summary from synchronized payment metadata.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
[
  {
    "id": "pm_123",
    "type": "card",
    "last4": "4242",
    "brand": "visa",
    "expMonth": 12,
    "expYear": 2030,
    "isDefault": true,
    "provider": "stripe"
  }
]
```

---

### 13. Update Onboarding Step

**PATCH** `/organizations/onboarding/:step`

Mark onboarding step as completed.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "completed": true,
  "data": {
    "usersInvited": 3
  }
}
```

**Response (200):** No content

---

## Error Responses

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Validation error details",
  "error": "Bad Request"
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "Доступ заборонено",
  "error": "Forbidden"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Ресурс не знайдено",
  "error": "Not Found"
}
```

### 429 Too Many Requests
```json
{
  "statusCode": 429,
  "message": "Забагато спроб",
  "error": "Too Many Requests",
  "retryAfter": 60
}
```

### 500 Internal Server Error
```json
{
  "statusCode": 500,
  "message": "Internal server error",
  "error": "Internal Server Error"
}
```

---

## Rate Limiting

| Endpoint | Limit | TTL |
|----------|-------|-----|
| POST /auth/login | 5 | 60s |
| POST /organizations/register | 3 | 1h |
| POST /auth/forgot-password | 3 | 1h |

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Maximum requests
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Time when limit resets (epoch)

---

## Security

### JWT Payload Structure
```json
{
  "user_id": "uuid",
  "tenant_id": "uuid",
  "role": "organization_owner",
  "subscription_plan": "professional",
  "email": "user@example.com",
  "jti": "uuid",
  "iat": 1234567890,
  "exp": 1234568790
}
```

### Token Expiration
- Access token: 15 minutes
- Refresh token: 7 days
- Password reset token: 1 hour
- Email verification token: 24 hours
- Invitation token: 7 days

### Security Headers
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- `Content-Security-Policy: default-src 'self'`
