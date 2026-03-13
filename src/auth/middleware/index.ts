import {
  Injectable,
  NestMiddleware,
  ForbiddenException,
  UnauthorizedException,
} from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { JwtPayload } from "../interfaces/jwt.interface";
import { generateRateLimitKey } from "../../common/utils/validation.util";

/**
 * Rate Limiting Middleware
 */
@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private rateLimitStore = new Map<
    string,
    { count: number; resetTime: number }
  >();

  async use(req: Request, res: Response, next: NextFunction) {
    const identifier = this.getIdentifier(req);
    const action = this.getAction(req);
    const tenantId = (req.user as JwtPayload)?.tenant_id;

    const key = generateRateLimitKey(identifier, action, tenantId);
    const now = Date.now();
    const window = 15 * 60 * 1000; // 15 minutes
    const maxAttempts = 5;

    const record = this.rateLimitStore.get(key);

    if (!record || now > record.resetTime) {
      this.rateLimitStore.set(key, {
        count: 1,
        resetTime: now + window,
      });
      return next();
    }

    if (record.count >= maxAttempts) {
      const remainingTime = Math.ceil((record.resetTime - now) / 1000 / 60);
      throw new ForbiddenException(
        `Забагато спроб. Спробуйте через ${remainingTime} хвилин.`,
      );
    }

    record.count++;
    this.rateLimitStore.set(key, record);

    // Add rate limit headers
    res.setHeader("X-RateLimit-Limit", maxAttempts);
    res.setHeader("X-RateLimit-Remaining", maxAttempts - record.count);
    res.setHeader("X-RateLimit-Reset", record.resetTime);

    next();
  }

  private getIdentifier(req: Request): string {
    return (req.user as JwtPayload)?.user_id || req.ip || "unknown";
  }

  private getAction(req: Request): string {
    return `${req.method}:${req.route?.path || req.path}`;
  }
}

/**
 * Tenant Context Middleware
 * Ensures all queries include tenant_id
 */
@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const user = req.user as JwtPayload;

    if (!user) {
      return next();
    }

    // Set tenant context for downstream services
    req.tenantId = user.tenant_id;
    req.userId = user.user_id;
    req.userRole = user.role;
    req.subscriptionPlan = user.subscription_plan;

    next();
  }
}

/**
 * Request Logging Middleware
 */
@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();

    res.on("finish", () => {
      const duration = Date.now() - start;
      const user = req.user as JwtPayload;

      const logData = {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        userId: user?.user_id,
        tenantId: user?.tenant_id,
        ip: req.ip,
        userAgent: req.get("user-agent"),
      };

      console.log(JSON.stringify(logData));
    });

    next();
  }
}

/**
 * XSS Protection Middleware
 */
@Injectable()
export class XssProtectionMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Set security headers
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Content-Security-Policy", "default-src 'self'");
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains",
    );

    next();
  }
}

/**
 * Correlation ID Middleware
 * Adds unique ID to each request for tracing
 */
@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const correlationId =
      (req.headers["x-correlation-id"] as string) ||
      `req_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    req.correlationId = correlationId;
    res.setHeader("X-Correlation-ID", correlationId);

    next();
  }
}

/**
 * Password Change Check Middleware
 */
@Injectable()
export class PasswordChangeCheckMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const user = req.user as JwtPayload;
    const userDetails = req.userDetails;

    if (!userDetails) {
      return next();
    }

    // Check if password was changed recently (e.g., 90 days)
    if (userDetails.lastPasswordChangeAt) {
      const daysSinceChange = Math.floor(
        (Date.now() - userDetails.lastPasswordChangeAt.getTime()) /
          (1000 * 60 * 60 * 24),
      );

      if (daysSinceChange > 90) {
        // Add warning header (don't block request)
        res.setHeader("X-Password-Warning", "password-expiring-soon");
      }
    }

    next();
  }
}
