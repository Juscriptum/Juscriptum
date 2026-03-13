import {
  Injectable,
  NestMiddleware,
  LoggerService as NestLoggerService,
  RequestMethod,
} from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";
import { LoggingService } from "./logging.service";

/**
 * Extend Express Request to include logging metadata
 */
declare global {
  namespace Express {
    interface Request {
      requestId: string;
      startTime: number;
      tenantId?: string;
      userId?: string;
      userRole?: string;
    }
  }
}

/**
 * HTTP methods that should be logged
 */
const LOGGABLE_METHODS = [
  RequestMethod.POST,
  RequestMethod.PUT,
  RequestMethod.PATCH,
  RequestMethod.DELETE,
];

/**
 * Paths that should be excluded from logging
 */
const EXCLUDE_PATHS = [
  "/health",
  "/healthz",
  "/readiness",
  "/metrics",
  "/favicon.ico",
];

/**
 * Headers that should be excluded from logs for security
 */
const EXCLUDE_HEADERS = [
  "authorization",
  "cookie",
  "set-cookie",
  "x-api-key",
  "x-auth-token",
];

/**
 * Request/Response logging middleware
 * Logs HTTP requests with correlation IDs, timing, and context
 */
@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  constructor(private readonly logger: LoggingService) {}

  /**
   * Middleware handler
   */
  use(req: Request, res: Response, next: NextFunction): void {
    // Skip logging for excluded paths
    if (this.shouldExcludePath(req.path)) {
      return next();
    }

    // Generate or retrieve request ID
    const requestId = (req.headers["x-request-id"] as string) || uuidv4();

    // Attach request ID and start time to request
    req.requestId = requestId;
    req.startTime = Date.now();

    // Add request ID to response headers
    res.setHeader("X-Request-ID", requestId);

    // Extract tenant and user context
    const context = this.extractContext(req);

    // Set up response listener
    this.setupResponseLogging(req, res, context);

    next();
  }

  /**
   * Check if path should be excluded from logging
   */
  private shouldExcludePath(path: string): boolean {
    return EXCLUDE_PATHS.some((excludedPath) => path.startsWith(excludedPath));
  }

  /**
   * Extract context from request
   */
  private extractContext(req: Request): {
    tenantId?: string;
    userId?: string;
    userRole?: string;
    ip?: string;
    userAgent?: string;
  } {
    return {
      tenantId: (req as any).tenantId,
      userId: (req as any).userId,
      userRole: (req as any).userRole,
      ip: this.getClientIp(req),
      userAgent: req.headers["user-agent"],
    };
  }

  /**
   * Get client IP address from request
   */
  private getClientIp(req: Request): string {
    return (
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      (req.headers["x-real-ip"] as string) ||
      req.socket.remoteAddress ||
      "unknown"
    );
  }

  /**
   * Sanitize headers by removing sensitive information
   */
  private sanitizeHeaders(headers: any): any {
    const sanitized: any = {};

    for (const [key, value] of Object.entries(headers)) {
      const headerKey = key.toLowerCase();
      if (!EXCLUDE_HEADERS.includes(headerKey)) {
        sanitized[key] = value;
      } else {
        sanitized[key] = "[REDACTED]";
      }
    }

    return sanitized;
  }

  /**
   * Map HTTP method string to RequestMethod enum
   */
  private mapToRequestMethod(method: string): RequestMethod | null {
    const methodMap: Record<string, RequestMethod> = {
      GET: RequestMethod.GET,
      POST: RequestMethod.POST,
      PUT: RequestMethod.PUT,
      PATCH: RequestMethod.PATCH,
      DELETE: RequestMethod.DELETE,
      OPTIONS: RequestMethod.OPTIONS,
      HEAD: RequestMethod.HEAD,
      ALL: RequestMethod.ALL,
    };
    return methodMap[method.toUpperCase()] ?? null;
  }

  /**
   * Set up response logging
   */
  private setupResponseLogging(
    req: Request,
    res: Response,
    context: any,
  ): void {
    const originalEnd = res.end.bind(res);
    const startTime = req.startTime;

    res.end = ((
      chunk?: any,
      encoding?: BufferEncoding | (() => void),
      cb?: () => void,
    ) => {
      const responseTime = Date.now() - startTime;
      const method = this.mapToRequestMethod(req.method);

      // Log the request/response
      if (method !== null) {
        this.logRequestResponse(req, res, responseTime, method, context);
      }

      // Call original end with correct signature
      if (typeof encoding === "function") {
        return originalEnd(chunk, encoding);
      }
      // Use type assertion since encoding can be undefined and originalEnd accepts BufferEncoding | undefined
      return originalEnd(chunk, encoding as BufferEncoding, cb);
    }) as typeof res.end;
  }

  /**
   * Log request/response details
   */
  private logRequestResponse(
    req: Request,
    res: Response,
    responseTime: number,
    method: RequestMethod,
    context: any,
  ): void {
    const statusCode = res.statusCode;
    const methodStr = RequestMethod[method];

    // Determine log level based on status code and method
    const shouldLog = this.shouldLogRequest(method, statusCode, responseTime);

    if (!shouldLog) {
      return;
    }

    // Extract request information
    const requestInfo = {
      method: methodStr,
      path: req.path,
      query: this.sanitizeQuery(req.query),
      headers: this.sanitizeHeaders(req.headers),
      ip: context.ip,
      userAgent: context.userAgent,
    };

    // Extract response information
    const responseInfo = {
      statusCode,
      responseTimeMs: responseTime,
      headers: this.sanitizeHeaders(res.getHeaders()),
    };

    // Log with context
    this.logger.logHttpRequest(methodStr, req.path, statusCode, responseTime, {
      ...context,
      requestId: req.requestId,
      request: requestInfo,
      response: responseInfo,
    });
  }

  /**
   * Sanitize query parameters
   */
  private sanitizeQuery(query: any): any {
    if (!query || typeof query !== "object") {
      return query;
    }

    const sanitized: any = {};
    const sensitiveParams = [
      "password",
      "token",
      "secret",
      "api_key",
      "authorization",
    ];

    for (const [key, value] of Object.entries(query)) {
      if (sensitiveParams.some((param) => key.toLowerCase().includes(param))) {
        sanitized[key] = "[REDACTED]";
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Determine if request should be logged
   */
  private shouldLogRequest(
    method: RequestMethod,
    statusCode: number,
    responseTime: number,
  ): boolean {
    // Always log errors (4xx, 5xx)
    if (statusCode >= 400) {
      return true;
    }

    // Always log modifying methods (POST, PUT, PATCH, DELETE)
    if (LOGGABLE_METHODS.includes(method)) {
      return true;
    }

    // Log slow requests (> 1000ms) even for other methods
    if (responseTime > 1000) {
      return true;
    }

    // Don't log GET, HEAD, OPTIONS by default (too noisy)
    return false;
  }
}
