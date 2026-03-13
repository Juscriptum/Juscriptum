import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from "@nestjs/common";
import { Observable, throwError } from "rxjs";
import { catchError, tap } from "rxjs/operators";
import { LoggingService, LogContext } from "./logging.service";

/**
 * Logging interceptor options
 */
export interface LoggingInterceptorOptions {
  logExecutionTime?: boolean;
  logArgs?: boolean;
  logResult?: boolean;
  logErrors?: boolean;
  executionTimeThreshold?: number; // milliseconds
  excludeMethods?: string[];
  excludePaths?: string[];
}

/**
 * Method-level logging interceptor
 * Logs method calls, execution time, and errors
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  constructor(
    private readonly loggingService: LoggingService,
    private readonly options: LoggingInterceptorOptions = {},
  ) {
    this.options = {
      logExecutionTime: true,
      logArgs: false,
      logResult: false,
      logErrors: true,
      executionTimeThreshold: 1000, // Log slow methods (> 1s)
      excludeMethods: ["GET", "OPTIONS"],
      excludePaths: ["/health", "/healthz", "/readiness"],
      ...options,
    };
  }

  /**
   * Interceptor method
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    // Skip logging for excluded paths or methods
    if (this.shouldExclude(request)) {
      return next.handle();
    }

    const startTime = Date.now();
    const controller = context.getClass().name;
    const method = context.getHandler().name;

    // Extract context for logging
    const logContext = this.extractLogContext(request, controller, method);

    // Log method entry
    this.logMethodEntry(logContext, request);

    return next.handle().pipe(
      tap((data) => {
        // Log method exit
        this.logMethodExit(logContext, startTime, data);
      }),
      catchError((error) => {
        // Log method error
        this.logMethodError(logContext, error);
        return throwError(() => error);
      }),
    );
  }

  /**
   * Check if request should be excluded from logging
   */
  private shouldExclude(request: any): boolean {
    const method = request.method;
    const path = request.path;

    if (this.options.excludeMethods?.includes(method)) {
      return true;
    }

    if (
      this.options.excludePaths?.some((excludedPath) =>
        path.startsWith(excludedPath),
      )
    ) {
      return true;
    }

    return false;
  }

  /**
   * Extract log context from request and execution context
   */
  private extractLogContext(
    request: any,
    controller: string,
    method: string,
  ): LogContext {
    return {
      requestId: request.requestId,
      tenantId: request.tenantId,
      userId: request.userId,
      userRole: request.userRole,
      ip: this.getClientIp(request),
      userAgent: request.headers?.["user-agent"],
      controller,
      method,
      httpMethod: request.method,
      path: request.path,
    };
  }

  /**
   * Get client IP address
   */
  private getClientIp(request: any): string {
    return (
      request.headers?.["x-forwarded-for"]?.split(",")[0]?.trim() ||
      request.headers?.["x-real-ip"] ||
      request.socket?.remoteAddress ||
      "unknown"
    );
  }

  /**
   * Log method entry
   */
  private logMethodEntry(context: LogContext, request: any): void {
    const message = `${context.controller}.${context.method} called`;

    const logData: LogContext = {
      ...context,
      eventType: "method_call",
      phase: "entry",
    };

    // Add request arguments if enabled
    if (
      this.options.logArgs &&
      request.body &&
      Object.keys(request.body).length > 0
    ) {
      logData.requestBody = this.sanitizeBody(request.body);
    }

    if (request.query && Object.keys(request.query).length > 0) {
      logData.query = this.sanitizeQuery(request.query);
    }

    this.loggingService.debug(message, logData);
  }

  /**
   * Log method exit
   */
  private logMethodExit(
    context: LogContext,
    startTime: number,
    data?: any,
  ): void {
    const executionTime = Date.now() - startTime;
    const message = `${context.controller}.${context.method} completed in ${executionTime}ms`;

    const logData: LogContext = {
      ...context,
      eventType: "method_call",
      phase: "exit",
      executionTimeMs: executionTime,
    };

    // Add response data if enabled
    if (this.options.logResult && data) {
      logData.response = this.sanitizeResponse(data);
    }

    // Determine log level based on execution time
    if (
      this.options.logExecutionTime &&
      executionTime > (this.options.executionTimeThreshold || 1000)
    ) {
      // Log slow methods as warnings
      this.loggingService.warn(message, logData);
    } else {
      this.loggingService.debug(message, logData);
    }
  }

  /**
   * Log method error
   */
  private logMethodError(context: LogContext, error: any): void {
    const message = `${context.controller}.${context.method} failed`;

    const logData: LogContext = {
      ...context,
      eventType: "method_call",
      phase: "error",
      error: error.message,
      errorName: error.name,
    };

    if (error.stack) {
      logData.stack = error.stack;
    }

    if (this.options.logErrors) {
      this.loggingService.error(message, error.stack, logData);
    }
  }

  /**
   * Sanitize request body by removing sensitive fields
   */
  private sanitizeBody(body: any): any {
    if (!body || typeof body !== "object") {
      return body;
    }

    const sanitized: any = {};
    const sensitiveFields = [
      "password",
      "token",
      "secret",
      "apiKey",
      "creditCard",
      "ssn",
    ];

    for (const [key, value] of Object.entries(body)) {
      const isSensitive = sensitiveFields.some((field) =>
        key.toLowerCase().includes(field.toLowerCase()),
      );

      if (isSensitive) {
        sanitized[key] = "[REDACTED]";
      } else if (typeof value === "object" && value !== null) {
        sanitized[key] = this.sanitizeBody(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
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
   * Sanitize response data by removing sensitive fields
   */
  private sanitizeResponse(data: any): any {
    if (!data || typeof data !== "object") {
      return data;
    }

    const sanitized: any = {};
    const sensitiveFields = [
      "password",
      "token",
      "secret",
      "accessToken",
      "refreshToken",
    ];

    for (const [key, value] of Object.entries(data)) {
      const isSensitive = sensitiveFields.some((field) =>
        key.toLowerCase().includes(field.toLowerCase()),
      );

      if (isSensitive) {
        sanitized[key] = "[REDACTED]";
      } else if (typeof value === "object" && value !== null) {
        sanitized[key] = this.sanitizeResponse(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }
}
