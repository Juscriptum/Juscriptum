# Security Quick Reference Card

Quick reference for common security tasks and configurations.

---

## Environment Variables (Required in Production)

```bash
# Authentication
JWT_SECRET=<64-char-random-string>
JWT_REFRESH_SECRET=<64-char-random-string>

# CORS
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com

# Database
DB_PASSWORD=<strong-password>
DB_SSL=true
DB_SYNC=false

# Encryption
ENCRYPT_PII=true
ENCRYPTION_KEY=<32-byte-hex-string>
```

Generate secrets:
```bash
openssl rand -base64 64    # JWT secret
openssl rand -hex 32       # Encryption key
```

---

## Rate Limiting (Auth Endpoints)

| Endpoint | Limit | Window | Block Duration |
|----------|-------|--------|----------------|
| Login | 5 | 1 min | 5 min |
| Register | 3 | 1 hour | 1 hour |
| Forgot Password | 3 | 1 hour | 1 hour |
| Reset Password | 5 | 1 hour | - |
| Refresh Token | 10 | 1 min | - |

---

## Security Headers Checklist

```typescript
// Install helmet
npm install @nestjs/helmet

// In main.ts
import helmet from '@nestjs/helmet';
app.use(helmet());
```

Headers to verify:
- [ ] X-Frame-Options: DENY
- [ ] X-Content-Type-Options: nosniff
- [ ] X-XSS-Protection: 1; mode=block
- [ ] Strict-Transport-Security (HSTS)
- [ ] Content-Security-Policy

---

## Common Security Tasks

### 1. Add New Authenticated Endpoint

```typescript
@Get('secure-data')
@UseGuards(JwtAuthGuard, TenantGuard)
@ApiBearerAuth()
async getSecureData(@Req() req: any) {
    const tenantId = req.user?.tenant_id;
    const userId = req.user?.user_id;
    // Always filter by tenantId
    return this.service.getData(tenantId, userId);
}
```

### 2. Add RBAC Protection

```typescript
@Post('admin-action')
@UseGuards(JwtAuthGuard, TenantGuard, RbacGuard)
@ApiBearerAuth()
async adminAction(@Req() req: any) {
    // Only users with required role can access
    return this.service.adminAction();
}
```

### 3. Validate DTO Input

```typescript
export class CreateClientDto {
    @IsString()
    @MinLength(2)
    @MaxLength(100)
    firstName: string;

    @IsEmail()
    email: string;

    @IsOptional()
    @Matches(/^\d{8}$/, { message: 'EDRPOU must be 8 digits' })
    edrpou?: string;
}
```

### 4. Protect Against SQL Injection

```typescript
// ✅ GOOD - Parameterized query
query.andWhere(
    'client.firstName ILIKE :search',
    { search: `%${filters.search}%` }
);

// ❌ BAD - String concatenation
query.andWhere(
    `client.firstName ILIKE '%${filters.search}%'`
);
```

### 5. Add Rate Limiting to Endpoint

```typescript
@Post('sensitive-action')
@Throttle([
    { name: 'sensitive', limit: 3, ttl: 60000 }
])
async sensitiveAction() {
    // Limited to 3 requests per minute
}
```

### 6. Log Security Event

```typescript
// In service
this.loggingService.logSecurityEvent(
    'suspicious_activity',
    'high',
    {
        userId,
        tenantId,
        ipAddress,
        reason: 'Multiple failed login attempts'
    }
);
```

### 7. Create Audit Log Entry

```typescript
await this.auditService.log({
    tenantId,
    userId,
    action: 'update',
    entityType: 'Client',
    entityId: clientId,
    oldValues: { status: 'active' },
    newValues: { status: 'blocked' },
    ipAddress,
    userAgent,
});
```

---

## Multi-Tenant Data Access

### Always Filter by Tenant ID

```typescript
// ✅ GOOD
async findAll(tenantId: string) {
    return this.repository.find({
        where: { tenantId, deletedAt: null }
    });
}

// ❌ BAD - No tenant filter
async findAll() {
    return this.repository.find();
}
```

### Validate Tenant Access

```typescript
async findById(tenantId: string, id: string) {
    const entity = await this.repository.findOne({
        where: { id, tenantId }
    });

    if (!entity) {
        throw new NotFoundException('Not found');
    }

    return entity;
}
```

---

## Password Security

### Password Requirements
- Minimum 8 characters
- At least one lowercase letter
- At least one uppercase letter
- At least one number
- At least one special character

### Hashing
```typescript
const salt = await generateSalt();
const passwordHash = await hashPassword(password, salt);
```

### Validation
```typescript
const validation = validatePasswordStrength(password);
if (!validation.valid) {
    throw new ConflictException(
        'Password too weak: ' + validation.errors.join(', ')
    );
}
```

---

## File Upload Security

### Validate File Upload
```typescript
const validation = validateFileUpload(
    file,
    ['application/pdf', 'image/jpeg', 'image/png'],
    10 * 1024 * 1024  // 10 MB
);

if (!validation.valid) {
    throw new BadRequestException(validation.error);
}
```

### Allowed MIME Types
```typescript
const ALLOWED_MIME_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];
```

### Blocked Extensions
```typescript
const DANGEROUS_EXTENSIONS = [
    '.exe', '.bat', '.sh', '.php', '.js',
    '.vbs', '.jar', '.cmd', '.com'
];
```

---

## Error Handling

### Don't Leak Information

```typescript
// ✅ GOOD - Generic error
if (!user) {
    throw new UnauthorizedException('Invalid credentials');
}

// ❌ BAD - Reveals user existence
if (!user) {
    throw new UnauthorizedException('User not found');
}
```

### Disable Error Messages in Production

```typescript
// In main.ts
new ValidationPipe({
    disableErrorMessages:
        configService.get<string>('NODE_ENV') === 'production'
})
```

---

## Common Vulnerabilities & Prevention

### SQL Injection
- ✅ Use parameterized queries
- ✅ Use TypeORM query builder
- ✅ Validate and sanitize input
- ❌ Never concatenate SQL strings

### XSS (Cross-Site Scripting)
- ✅ Sanitize user input
- ✅ Use Content-Security-Policy header
- ✅ Escape HTML entities
- ❌ Never render raw user HTML

### CSRF (Cross-Site Request Forgery)
- ✅ Use CSRF tokens
- ✅ Validate Origin header
- ✅ Use SameSite cookie attribute
- ✅ Require re-authentication for sensitive actions

### Brute Force Attacks
- ✅ Implement rate limiting
- ✅ Account lockout after failed attempts
- ✅ Use CAPTCHA
- ✅ Monitor suspicious activity

### Session Hijacking
- ✅ Use HTTPS only
- ✅ Set secure cookie flags
- ✅ Implement token rotation
- ✅ Short token expiration (15 min)

---

## Security Testing Commands

### Test Rate Limiting
```bash
for i in {1..10}; do
  curl -X POST http://localhost:3000/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
  echo ""
done
```

### Test SQL Injection
```bash
curl -X GET "http://localhost:3000/v1/clients?search='; DROP TABLE clients;--" \
  -H "Authorization: Bearer <token>"
# Should return 403 Forbidden
```

### Test CORS
```bash
curl -H "Origin: https://malicious-site.com" \
  -H "Access-Control-Request-Method: POST" \
  -X OPTIONS http://localhost:3000/v1/auth/login \
  -v
# Should reject if not in ALLOWED_ORIGINS
```

### Test Authentication
```bash
# Should return 401 Unauthorized
curl -X GET http://localhost:3000/v1/clients

# Should work with valid token
curl -X GET http://localhost:3000/v1/clients \
  -H "Authorization: Bearer <valid-token>"
```

---

## Security Checklist for New Features

### Before Implementation
- [ ] Review data access patterns
- [ ] Plan tenant isolation
- [ ] Define validation rules
- [ ] Identify audit points

### During Implementation
- [ ] Add DTO validation
- [ ] Implement tenant filtering
- [ ] Add authentication guards
- [ ] Implement rate limiting
- [ ] Add audit logging
- [ ] Validate user permissions

### After Implementation
- [ ] Test with invalid input
- [ ] Verify tenant isolation
- [ ] Test rate limiting
- [ ] Check error messages
- [ ] Review audit logs
- [ ] Security peer review

---

## Emergency Contacts

### Security Incident Response
1. Enable maintenance mode
2. Revoke compromised tokens
3. Force password reset
4. Review audit logs
5. Notify security team

### Contact Information
- Security Team: security@yourdomain.com
- Emergency Hotline: +380-XX-XXX-XXXX

---

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NestJS Security](https://docs.nestjs.com/security/helmet)
- [Full Security Audit Report](./SECURITY_AUDIT_REPORT.md)
- [Security Hardening Guide](./SECURITY_HARDENING_GUIDE.md)

---

**Last Updated:** 2026-02-18
