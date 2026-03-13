import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  LoggerService,
} from "@nestjs/common";
import { Request, Response } from "express";
import { LoggingService, LogContext } from "./logging.service";

/**
 * Error response interface
 */
interface ErrorResponse {
  statusCode: number;
  timestamp: string;
  path: string;
  method: string;
  requestId?: string;
  error: string;
  message: string | object;
  stack?: string;
}

/**
 * Global exception filter
 * Catches all exceptions and logs them with context
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private logger: LoggingService) {}

  /**
   * Exception handler
   */
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const statusCode =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : "Internal server error";

    const errorResponse = this.buildErrorResponse(
      exception,
      request,
      statusCode,
      message,
    );

    // Log the error with context
    this.logException(exception, request, errorResponse);

    // Send error response
    response.status(statusCode).json(this.sanitizeError(errorResponse));
  }

  /**
   * Build error response object
   */
  private buildErrorResponse(
    exception: unknown,
    request: Request,
    statusCode: number,
    message: any,
  ): ErrorResponse {
    const baseResponse: ErrorResponse = {
      statusCode,
      timestamp: new Date().toISOString(),
      path: request.path,
      method: request.method,
      requestId: (request as any).requestId,
      error: this.getErrorName(exception),
      message: typeof message === "object" ? (message as any).message : message,
    };

    // Add stack trace in development
    if (process.env.NODE_ENV !== "production") {
      if (exception instanceof Error) {
        baseResponse.stack = exception.stack;
      }
    }

    // Handle validation errors
    if (typeof message === "object" && message !== null) {
      const msgObj = message as any;
      if (msgObj.error && typeof msgObj.error === "string") {
        baseResponse.error = msgObj.error;
      }
      if (msgObj.message) {
        baseResponse.message = msgObj.message;
      }
    }

    return baseResponse;
  }

  /**
   * Get error name
   */
  private getErrorName(exception: unknown): string {
    if (exception instanceof HttpException) {
      return exception.constructor.name;
    }
    if (exception instanceof Error) {
      return exception.constructor.name;
    }
    return "Error";
  }

  /**
   * Extract context from request for logging
   */
  private extractLogContext(request: Request): LogContext {
    return {
      requestId: (request as any).requestId,
      tenantId: (request as any).tenantId,
      userId: (request as any).userId,
      userRole: (request as any).userRole,
      ip: this.getClientIp(request),
      userAgent: request.headers["user-agent"],
      method: request.method,
      path: request.path,
    };
  }

  /**
   * Get client IP address from request
   */
  private getClientIp(request: Request): string {
    return (
      (request.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      (request.headers["x-real-ip"] as string) ||
      request.socket.remoteAddress ||
      "unknown"
    );
  }

  /**
   * Log exception with context
   */
  private logException(
    exception: unknown,
    request: Request,
    errorResponse: ErrorResponse,
  ): void {
    const context = this.extractLogContext(request);

    const logData: LogContext = {
      ...context,
      errorType: errorResponse.error,
      errorMessage: errorResponse.message,
      statusCode: errorResponse.statusCode,
    };

    // Log stack trace if available
    if (exception instanceof Error && exception.stack) {
      logData.stack = exception.stack;
    }

    // Log at appropriate level
    const statusCode = errorResponse.statusCode;
    if (statusCode >= 500) {
      // Server errors
      this.logger.error(
        `Server Error: ${errorResponse.error}`,
        exception instanceof Error ? exception.stack : undefined,
        logData,
      );
    } else if (statusCode >= 400) {
      // Client errors
      this.logger.warn(`Client Error: ${errorResponse.error}`, logData);
      this.logSecurityViolation(statusCode, errorResponse, context);
    } else {
      // Other errors
      this.logger.error(
        `Error: ${errorResponse.error}`,
        exception instanceof Error ? exception.stack : undefined,
        logData,
      );
    }

    // Log to error log file specifically
    this.logger.logHttpRequest(
      request.method,
      request.path,
      statusCode,
      (request as any).startTime ? Date.now() - (request as any).startTime : 0,
      context,
    );
  }

  private logSecurityViolation(
    statusCode: number,
    errorResponse: ErrorResponse,
    context: LogContext,
  ): void {
    if (statusCode !== HttpStatus.FORBIDDEN) {
      return;
    }

    const message = Array.isArray(errorResponse.message)
      ? errorResponse.message.join(" ")
      : String(errorResponse.message ?? "");
    const normalized = message.toLowerCase();

    if (normalized.includes("tenant context")) {
      this.logger.logSecurityEvent(
        "tenant_context_violation_detected",
        "high",
        {
          ...context,
          errorMessage: message,
        },
      );
      return;
    }

    if (
      normalized.includes("ізоляції даних") ||
      normalized.includes("доступ до запису обмежено")
    ) {
      this.logger.logSecurityEvent(
        "data_isolation_violation_detected",
        "high",
        {
          ...context,
          errorMessage: message,
        },
      );
      return;
    }
  }

  /**
   * Sanitize error response for production
   * Remove sensitive information
   */
  private sanitizeError(errorResponse: ErrorResponse): any {
    if (process.env.NODE_ENV === "production") {
      // Remove stack trace in production
      const { stack, ...sanitized } = errorResponse;
      return sanitized;
    }

    // Return full error in development
    return errorResponse;
  }

  /**
   * Set logger instance (for dependency injection)
   */
  setLogger(logger: LoggingService): void {
    this.logger = logger;
  }
}
