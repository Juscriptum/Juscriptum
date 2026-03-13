# Security Hardening Quick Guide

This guide provides step-by-step instructions for securing the Law Organizer application for production deployment.

## Quick Start Security Checklist

### 1. Generate Strong Secrets

```bash
# Generate JWT secrets (minimum 32 characters)
openssl rand -base64 64

# Generate encryption key
openssl rand -hex 32
```

### 2. Environment Configuration

Create `.env` file with production settings:

```bash
# Environment
NODE_ENV=production
PORT=3000

# JWT Secrets (CRITICAL - Change these!)
JWT_SECRET=<your-64-char-secret-here>
JWT_REFRESH_SECRET=<your-64-char-refresh-secret-here>
JWT_ACCESS_TOKEN_EXPIRY=15m
JWT_REFRESH_TOKEN_EXPIRY=7d

# Database
DB_TYPE=postgres
DB_HOST=your-db-host
DB_PORT=5432
DB_USER=your-db-user
DB_PASSWORD=<strong-db-password>
DB_NAME=law_organizer
DB_SSL=true
DB_SYNC=false  # IMPORTANT: Disable in production

# CORS (CRITICAL - Specify your domains)
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com

# Redis
REDIS_ENABLED=true
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=<redis-password>

# Email SMTP
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_USER=your-email
SMTP_PASSWORD=<smtp-password>

# Storage
STORAGE_PROVIDER=s3
AWS_S3_BUCKET=your-bucket
AWS_ACCESS_KEY_ID=<access-key>
AWS_SECRET_ACCESS_KEY=<secret-key>
AWS_REGION=us-east-1

# Rate Limiting
THROTTLE_TTL=60000
THROTTLE_LIMIT=100

# Security
ENABLE_AUDIT_LOGGING=true
ENCRYPT_PII=true
ENCRYPTION_KEY=<your-32-byte-hex-key>

# Monitoring
SENTRY_DSN=https://xxx@sentry.io/xxx
```

### 3. Install Security Packages

```bash
npm install @nestjs/helmet csurf
```

### 4. Add Security Middleware

Update `/src/main.ts`:

```typescript
import helmet from '@nestjs/helmet';
// ... other imports

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security headers
  app.use(helmet());

  // Rest of configuration...
}
```

### 5. Verify Security Configuration

Run these checks before deployment:

```bash
# Check environment variables
npm run start  # Should fail if missing JWT_SECRET in production

# Test rate limiting
curl -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test"}' \
  # Repeat 6 times - should get 429 error

# Test CORS
curl -H "Origin: https://malicious-site.com" \
  -H "Access-Control-Request-Method: POST" \
  -X OPTIONS http://localhost:3000/v1/auth/login
  # Should be blocked if not in ALLOWED_ORIGINS

# Test SQL injection protection
curl -X GET "http://localhost:3000/v1/clients?search='; DROP TABLE clients;--" \
  -H "Authorization: Bearer <token>"
  # Should return 403 Forbidden
```

### 6. Enable HTTPS

#### Option A: Using Nginx (Recommended)

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

#### Option B: Using Cloudflare

1. Add your domain to Cloudflare
2. Enable "Full (strict)" SSL/TLS mode
3. Enable "Always Use HTTPS"
4. Enable "Automatic HTTPS Rewrites"

### 7. Configure Firewall

```bash
# Allow only necessary ports
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable
```

### 8. Set Up Monitoring

#### Sentry Configuration

```typescript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});
```

#### Log Monitoring

- Monitor failed login attempts
- Track rate limit violations
- Alert on SQL injection attempts
- Monitor unusual traffic patterns

### 9. Database Security

```sql
-- Create dedicated database user
CREATE USER law_organizer_app WITH PASSWORD 'strong-password';

-- Grant minimal permissions
GRANT CONNECT ON DATABASE law_organizer TO law_organizer_app;
GRANT USAGE ON SCHEMA public TO law_organizer_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO law_organizer_app;

-- Enable SSL
ALTER DATABASE law_organizer SET ssl = true;
```

### 10. Redis Security

```bash
# In redis.conf
bind 127.0.0.1
protected-mode yes
requirepass your-strong-redis-password
tls-port 6379
tls-cert-file /path/to/redis.crt
tls-key-file /path/to/redis.key
```

### 11. Backup Strategy

```bash
# Database backup script
pg_dump -U law_organizer_app -h localhost law_organizer > backup_$(date +%Y%m%d).sql

# Encrypt backup
gpg --cipher-algo AES256 --symmetric --output backup_$(date +%Y%m%d).sql.gpg backup_$(date +%Y%m%d).sql

# Upload to S3
aws s3 cp backup_$(date +%Y%m%d).sql.gpg s3://your-backup-bucket/
```

### 12. Security Headers Test

After deployment, test security headers:

```bash
# Install testssl.sh
git clone https://github.com/drwetter/testssl.sh.git
cd testssl.sh

# Run security test
./testssl.sh https://yourdomain.com
```

Expected results:
- ✅ TLS 1.2 or 1.3 only
- ✅ Strong cipher suites
- ✅ HSTS enabled
- ✅ X-Frame-Options: DENY
- ✅ X-Content-Type-Options: nosniff
- ✅ X-XSS-Protection: 1; mode=block
- ✅ Content-Security-Policy header

## Post-Deployment Security Verification

### 1. Authentication Tests

```bash
# Test 1: Rate limiting on login
for i in {1..10}; do
  curl -X POST https://yourdomain.com/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
done
# Should get 429 Too Many Requests

# Test 2: SQL injection protection
curl -X GET "https://yourdomain.com/v1/clients?search='; DROP TABLE clients;--" \
  -H "Authorization: Bearer <token>"
# Should return 403 Forbidden

# Test 3: Unauthorized access
curl -X GET https://yourdomain.com/v1/clients
# Should return 401 Unauthorized
```

### 2. Multi-Tenant Isolation Test

```bash
# Test tenant isolation
# User from tenant A should not access tenant B's data

# Login as tenant A user
TOKEN_A=$(curl -X POST https://yourdomain.com/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"tenant-a@example.com","password":"password"}' \
  | jq -r '.accessToken')

# Try to access tenant B's data (should fail)
curl -X GET https://yourdomain.com/v1/clients/tenant-b-client-id \
  -H "Authorization: Bearer $TOKEN_A"
# Should return 403 Forbidden or 404 Not Found
```

### 3. HTTPS Verification

```bash
# Test HTTPS redirect
curl -I http://yourdomain.com
# Should return 301/302 redirect to https://

# Test certificate
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com
# Should show valid certificate
```

## Security Monitoring Dashboard

Set up alerts for:

1. **Failed Login Attempts** > 10 per minute per IP
2. **Rate Limit Violations** > 100 per minute
3. **SQL Injection Attempts** > 0
4. **Authentication Failures** > 50 per minute
5. **Unauthorized Access Attempts** > 20 per minute
6. **Account Lockouts** > 10 per hour
7. **Suspicious User Agents** > 0
8. **Geographic Anomalies** > Login from unusual countries

## Incident Response Plan

### If Security Breach Detected

1. **Immediate Actions**
   - Enable maintenance mode
   - Revoke all active tokens
   - Force password reset for affected users
   - Review audit logs

2. **Investigation**
   - Identify attack vector
   - Determine scope of breach
   - Document timeline

3. **Remediation**
   - Patch vulnerability
   - Update security rules
   - Notify affected users
   - Report to authorities if required

4. **Post-Incident**
   - Update security measures
   - Conduct security audit
   - Update documentation
   - Train team on new procedures

## Security Contacts

- **Security Team:** security@yourdomain.com
- **Emergency Hotline:** +380-XX-XXX-XXXX
- **Bug Bounty:** https://yourdomain.com/security

## Next Steps

1. ✅ Complete all items in Quick Start Checklist
2. ✅ Run security verification tests
3. ✅ Set up monitoring and alerting
4. ✅ Configure automated backups
5. ✅ Document incident response procedures
6. ✅ Train team on security best practices
7. ✅ Schedule regular security audits (quarterly)
8. ✅ Subscribe to security advisories
9. ✅ Plan penetration testing (annually)

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NestJS Security](https://docs.nestjs.com/security/helmet)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [PostgreSQL Security](https://www.postgresql.org/docs/current/security.html)

---

**Last Updated:** 2026-02-18
**Next Review:** 2026-03-18
