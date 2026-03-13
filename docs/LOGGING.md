# Logging Module Documentation

## Overview

The Logging Module provides structured, context-aware logging for the Law Organizer application. It supports multiple log levels, transports, and automatic context propagation for comprehensive application monitoring and debugging.

## Features

- **Multi-level logging**: debug, info, warn, error, fatal
- **Multiple transports**: console, file (with daily rotation), Sentry integration
- **Request/Response logging**: automatic HTTP request logging with correlation IDs
- **Context propagation**: tenant_id, user_id, request_id automatically included
- **Sensitive data redaction**: automatic masking of passwords, tokens, API keys
- **Performance monitoring**: execution time tracking with configurable thresholds
- **Method-level logging**: interceptor for automatic controller method logging
- **Global exception handling**: centralized error logging with context

## Installation

The module is already integrated into the application. Dependencies:

```bash
npm install winston nest-winston winston-daily-rotate-file @sentry/node
```

## Configuration

### Environment Variables

```bash
# Logging Configuration
LOG_LEVEL=debug                    # Log level: error, warn, info, http, verbose, debug, silly
LOG_FORMAT=json                   # Log format: json or text
LOG_DIR=./logs                    # Directory for log files
LOG_MAX_SIZE=20m                  # Maximum log file size
LOG_MAX_FILES=14d                 # Retention period for general logs
LOG_ERROR_MAX_FILES=30d           # Retention period for error logs

# Sentry Integration
SENTRY_DSN=https://xxxxxx@sentry.io/xxxxxx
SENTRY_ENVIRONMENT=development
SENTRY_TRACES_SAMPLE_RATE=0.1      # 10% of transactions sampled

# Feature Flags
ENABLE_REQUEST_LOGGING=true
ENABLE_METHOD_LOGGING=true
LOGGING_PERFORMANCE_THRESHOLD=1000   # Log methods taking > 1 second
```

### Log Levels

| Level   | Description                        | Usage                              |
|---------|------------------------------------|------------------------------------|
| `error` | Critical errors that stop execution | Unhandled exceptions, database errors |
| `warn`  | Warning messages                   | Failed login attempts, slow queries  |
| `info`  | Informational messages              | Business events, user actions        |
| `debug` | Detailed debugging information      | Request/response details, variables  |
| `verbose` | More detailed verbose messages    | Internal operations                 |
| `silly`  | Very detailed low-level logging    | Raw data, dumps                    |

## Usage

### Basic Service Integration

Import and inject the `LoggingService` in any service:

```typescript
import { Injectable } from '@nestjs/common';
import { LoggingService, LogContext } from '../common/logging';

@Injectable()
export class UserService {
  constructor(private readonly logger: LoggingService) {
    this.logger.setContext('UserService');
  }

  async createUser(data: CreateUserDto) {
    const context: LogContext = {
      tenantId: 'tenant-123',
      userId: 'user-456',
      action: 'create',
      entity: 'User',
    };

    this.logger.debug('Creating user', context);
    this.logger.logBusinessEvent('create', 'User', userId, context);
    this.logger.log('User created successfully', context);
  }
}
```

### Log Methods

#### Standard Logging

```typescript
// Debug level - detailed information for debugging
this.logger.debug('User data loaded', { userId, tenantId });

// Info level - informational messages
this.logger.log('User updated', { userId, tenantId });

// Warn level - warning messages
this.logger.warn('User already exists', { email });

// Error level - error messages with stack trace
this.logger.error('Database error', error.stack, { userId, query });

// Verbose level - more detailed than info
this.logger.verbose('Processing request', { requestId });
```

#### Specialized Logging Methods

```typescript
// HTTP Request/Response Logging
this.logger.logHttpRequest(
  'POST',
  '/api/users',
  201,
  150,
  { tenantId, userId, requestId }
);

// Database Query Logging
this.logger.logDatabaseQuery(
  'SELECT * FROM users WHERE id = ?',
  45,
  { tenantId, userId }
);

// Business Event Logging
this.logger.logBusinessEvent(
  'create',
  'Client',
  'client-123',
  { tenantId, userId, action: 'create' }
);

// Authentication Event Logging
this.logger.logAuthEvent('login', {
  tenantId,
  userId,
  ipAddress,
  userAgent,
});

// Security Event Logging
this.logger.logSecurityEvent(
  'brute_force_attempt',
  'high',
  { userId, tenantId, ipAddress, attempts: 10 }
);

// Performance Logging
this.logger.logPerformance(
  'process_payment',
  1250,
  1000,
  { tenantId, userId, paymentId }
);

// Error Logging
this.logger.logError(error, {
  userId,
  tenantId,
  operation: 'create_invoice',
});
```

### Context Propagation

The `LogContext` interface supports:

```typescript
interface LogContext {
  tenantId?: string;      // Tenant/organization ID
  userId?: string;        // User ID
  requestId?: string;      // Correlation/request ID
  action?: string;        // Action performed
  entity?: string;        // Entity type
  entityId?: string;      // Entity ID
  ip?: string;           // Client IP address
  userAgent?: string;      // User agent string
  [key: string]: any;    // Additional metadata
}
```

### Creating Child Loggers

Create a child logger with preset context:

```typescript
const userLogger = this.logger.child({ tenantId: 'tenant-123', userId: 'user-456' });

// All logs from userLogger automatically include the context
userLogger.log('Action performed');
userLogger.debug('Detailed information');
```

### Using LoggingInterceptor

Enable automatic method-level logging in your controllers:

```typescript
import { UseInterceptors } from '@nestjs/common';
import { LoggingInterceptor, LoggingInterceptorOptions } from '../common/logging';

@Controller('users')
@UseInterceptors(new LoggingInterceptor(loggingService, {
  logExecutionTime: true,
  logArgs: false,
  logResult: false,
  logErrors: true,
  executionTimeThreshold: 1000,
  excludeMethods: ['GET', 'OPTIONS'],
  excludePaths: ['/health', '/healthz'],
}))
export class UsersController {
  // All controller methods automatically logged
}
```

## Request/Response Middleware

The `LoggingMiddleware` automatically logs HTTP requests with:

- Request ID (correlation ID)
- Method, URL, path
- Query parameters (sanitized)
- Request headers (sanitized)
- Response status code
- Response time
- Tenant and user context

Excluded paths by default:
- `/health`
- `/healthz`
- `/readiness`
- `/metrics`
- `/favicon.ico`

## Global Exception Filter

The `GlobalExceptionFilter` catches all exceptions and logs them with:

- Error type and message
- Stack trace (development only)
- Request context (path, method, IP)
- User context (tenant, user)
- Request ID

## Sensitive Data Redaction

The logging module automatically redacts:

- Passwords
- Tokens
- Secrets
- API keys
- Authorization headers
- Credit card numbers
- SSN/social security numbers

Customize redaction by modifying `SENSITIVE_PATTERNS` in `logger.config.ts`.

## File Rotation

Log files are automatically rotated daily:

- **General logs**: `application-YYYY-MM-DD.log` (14 days retention)
- **Error logs**: `error-YYYY-MM-DD.log` (30 days retention)

Files older than the retention period are automatically deleted.

## Sentry Integration

Error tracking with Sentry is automatically enabled when `SENTRY_DSN` is configured:

```typescript
// Errors are automatically sent to Sentry
this.logger.error('Critical error', error.stack, context);

// Capture exceptions manually
import * as Sentry from '@sentry/node';
Sentry.captureException(error, { extra: context });
```

## Performance Monitoring

Monitor performance of operations:

```typescript
const startTime = Date.now();
await performComplexOperation();
const duration = Date.now() - startTime;

this.logger.logPerformance(
  'complex_operation',
  duration,
  1000, // threshold in ms
  { userId, tenantId }
);
// Logged as warning if duration > 1000ms
```

## Best Practices

1. **Use appropriate log levels**: Don't log everything at `debug` level
2. **Include context**: Always provide relevant context (tenant, user, request)
3. **Avoid sensitive data**: Never log passwords, tokens, or PII
4. **Use structured logging**: Log objects/JSON, not concatenated strings
5. **Log business events**: Use `logBusinessEvent` for important actions
6. **Monitor performance**: Use `logPerformance` for slow operations
7. **Set meaningful thresholds**: Configure thresholds based on your application

## Examples

### Example 1: Service with Logging

```typescript
@Injectable()
export class InvoiceService {
  constructor(private readonly logger: LoggingService) {
    this.logger.setContext('InvoiceService');
  }

  async createInvoice(dto: CreateInvoiceDto, userId: string, tenantId: string) {
    const startTime = Date.now();

    try {
      this.logger.debug('Creating invoice', { userId, tenantId, amount: dto.amount });

      const invoice = await this.invoiceRepository.save({
        ...dto,
        tenantId,
        createdBy: userId,
      });

      this.logger.logBusinessEvent('create', 'Invoice', invoice.id, {
        tenantId,
        userId,
        amount: dto.amount,
      });

      const duration = Date.now() - startTime;
      this.logger.logPerformance('create_invoice', duration, 500, { userId, tenantId });

      return invoice;
    } catch (error) {
      this.logger.logError(error, {
        action: 'create_invoice',
        userId,
        tenantId,
        amount: dto.amount,
      });
      throw error;
    }
  }
}
```

### Example 2: Controller with Logging

```typescript
@Controller('api/clients')
export class ClientsController {
  constructor(
    private readonly clientsService: ClientsService,
    private readonly logger: LoggingService,
  ) {
    this.logger.setContext('ClientsController');
  }

  @Post()
  async create(@Body() dto: CreateClientDto, @Request() req) {
    const context: LogContext = {
      tenantId: req.tenantId,
      userId: req.userId,
      requestId: req.requestId,
      action: 'create',
      entity: 'Client',
    };

    this.logger.debug('Creating client', context);

    const client = await this.clientsService.create(dto, context);

    this.logger.logBusinessEvent('create', 'Client', client.id, context);

    return client;
  }
}
```

## Troubleshooting

### Logs not appearing

1. Check `LOG_LEVEL` environment variable
2. Verify `ENABLE_REQUEST_LOGGING` and `ENABLE_METHOD_LOGGING` are set correctly
3. Check file permissions in `LOG_DIR`

### Too many logs

1. Increase `LOG_LEVEL` (e.g., from `debug` to `info`)
2. Adjust `executionTimeThreshold` for performance logs
3. Disable method logging for read-only endpoints

### Logs missing context

1. Ensure `LoggingMiddleware` is registered in `main.ts`
2. Verify guards are setting `tenantId` and `userId` on the request
3. Check that `request.requestId` is being generated

### Sentry not receiving errors

1. Verify `SENTRY_DSN` is set correctly
2. Check `SENTRY_TRACES_SAMPLE_RATE` if expecting performance traces
3. Ensure `SENTRY_ENVIRONMENT` matches your environment

## Module Structure

```
src/common/logging/
├── index.ts                          # Public API exports
├── logging.module.ts                 # NestJS module definition
├── logging.service.ts                # Main logging service
├── logging.config.ts                 # Winston configuration
├── logging.middleware.ts             # HTTP request logging
├── logging.interceptor.ts            # Method-level logging
└── global-exception.filter.ts       # Global error handling
```

## References

- [Winston Documentation](https://github.com/winstonjs/winston)
- [NestJS Logging](https://docs.nestjs.com/techniques/logger)
- [Sentry Node.js](https://docs.sentry.io/platforms/node/)
