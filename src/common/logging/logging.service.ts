import {
  Injectable,
  LoggerService as NestLoggerService,
  Scope,
  Inject,
  Logger,
} from "@nestjs/common";
import { v4 as uuidv4 } from "uuid";

/**
 * Simple logger interface
 */
interface SimpleLogger {
  debug(message: any, ...meta: any[]): void;
  error(message: any, trace?: string, ...meta: any[]): void;
  info(message: any, ...meta: any[]): void;
  warn(message: any, ...meta: any[]): void;
  verbose(message: any, ...meta: any[]): void;
  log(level: string, message: any, ...meta: any[]): void;
}

/**
 * Logging context interface for consistent log metadata
 */
export interface LogContext {
  tenantId?: string;
  userId?: string;
  requestId?: string;
  action?: string;
  entity?: string;
  entityId?: string;
  ip?: string;
  userAgent?: string;
  [key: string]: any;
}

/**
 * Structured logging service with context support
 * Extends NestJS LoggerService with enhanced capabilities
 */
@Injectable({ scope: Scope.TRANSIENT })
export class LoggingService implements NestLoggerService {
  private context: string;
  private readonly nestLogger = new Logger();

  constructor(
    @Inject("WINSTON_LOGGER") private readonly logger: SimpleLogger,
  ) {}

  /**
   * Set the logging context (typically the service/class name)
   */
  setContext(context: string): void {
    this.context = context;
  }

  /**
   * Generate or retrieve request ID from context
   */
  private getRequestId(contextData?: LogContext): string {
    if (contextData?.requestId) {
      return contextData.requestId;
    }
    return uuidv4();
  }

  /**
   * Create log metadata with context
   */
  private createLogMeta(
    contextData?: LogContext,
    additionalMeta?: Record<string, any>,
  ): LogContext {
    const requestId = this.getRequestId(contextData);

    return {
      requestId,
      context: this.context,
      ...contextData,
      ...additionalMeta,
    };
  }

  /**
   * Log a message at debug level
   */
  debug(message: any, contextData?: LogContext): void {
    const meta = this.createLogMeta(contextData);
    this.logger.debug(message, meta);
  }

  /**
   * Log a message at error level
   */
  error(message: any, trace?: string, contextData?: LogContext): void {
    const meta = this.createLogMeta(contextData);
    this.logger.error(message, trace, meta);
  }

  /**
   * Log a message at info level
   */
  log(message: any, contextData?: LogContext): void {
    const meta = this.createLogMeta(contextData);
    this.logger.info(message, meta);
  }

  /**
   * Log a message at verbose level
   */
  verbose(message: any, contextData?: LogContext): void {
    const meta = this.createLogMeta(contextData);
    this.logger.verbose(message, meta);
  }

  /**
   * Log a message at warn level
   */
  warn(message: any, contextData?: LogContext): void {
    const meta = this.createLogMeta(contextData);
    this.logger.warn(message, meta);
  }

  /**
   * Log HTTP request/response with timing
   */
  logHttpRequest(
    method: string,
    url: string,
    statusCode: number,
    responseTime: number,
    contextData?: LogContext,
  ): void {
    const meta = this.createLogMeta({
      ...contextData,
      method,
      url,
      statusCode,
      responseTimeMs: responseTime,
    });

    const level =
      statusCode >= 500 ? "error" : statusCode >= 400 ? "warn" : "info";
    this.logger.log(
      level,
      `HTTP ${method} ${url} ${statusCode} - ${responseTime}ms`,
      meta,
    );
  }

  /**
   * Log database query performance
   */
  logDatabaseQuery(
    query: string,
    duration: number,
    contextData?: LogContext,
  ): void {
    const meta = this.createLogMeta({
      ...contextData,
      queryType: "database",
      queryLength: query.length,
      durationMs: duration,
    });

    const level = duration > 1000 ? "warn" : "debug";
    this.logger.log(level, `Database query executed in ${duration}ms`, meta);
  }

  /**
   * Log business event with action and entity information
   */
  logBusinessEvent(
    action: string,
    entity: string,
    entityId?: string,
    contextData?: LogContext,
  ): void {
    const meta = this.createLogMeta({
      ...contextData,
      action,
      entity,
      entityId,
      eventType: "business",
    });

    this.logger.info(
      `Business event: ${action} ${entity}${entityId ? `:${entityId}` : ""}`,
      meta,
    );
  }

  /**
   * Log authentication event
   */
  logAuthEvent(
    event:
      | "login"
      | "logout"
      | "login_failed"
      | "token_refresh"
      | "mfa_verified"
      | "mfa_required"
      | "logout_all_devices"
      | "password_reset_requested",
    contextData?: LogContext,
  ): void {
    const meta = this.createLogMeta({
      ...contextData,
      eventType: "auth",
      authEvent: event,
    });

    const level = event === "login_failed" ? "warn" : "info";
    this.logger.log(level, `Authentication event: ${event}`, meta);
  }

  /**
   * Log security event
   */
  logSecurityEvent(
    event: string,
    severity: "low" | "medium" | "high" | "critical",
    contextData?: LogContext,
  ): void {
    const meta = this.createLogMeta({
      ...contextData,
      eventType: "security",
      securityEvent: event,
      severity,
    });

    const level =
      severity === "critical" || severity === "high" ? "error" : "warn";
    this.logger.log(
      level,
      `Security event: ${event} (severity: ${severity})`,
      meta,
    );
  }

  /**
   * Log performance metrics
   */
  logPerformance(
    operation: string,
    duration: number,
    threshold: number,
    contextData?: LogContext,
  ): void {
    const meta = this.createLogMeta({
      ...contextData,
      eventType: "performance",
      operation,
      durationMs: duration,
      thresholdMs: threshold,
      exceededThreshold: duration > threshold,
    });

    const level = duration > threshold ? "warn" : "debug";
    this.logger.log(
      level,
      `Performance: ${operation} completed in ${duration}ms`,
      meta,
    );
  }

  /**
   * Log error with stack trace and context
   */
  logError(error: Error | string, contextData?: LogContext): void {
    const errorMessage = error instanceof Error ? error.message : error;
    const errorStack = error instanceof Error ? error.stack : undefined;

    const meta = this.createLogMeta({
      ...contextData,
      error: errorMessage,
    });

    this.logger.error(errorMessage, errorStack, meta);
  }

  /**
   * Create a child logger with additional context
   */
  child(contextData: LogContext): LoggingService {
    const childService = new LoggingService(this.logger);
    childService.setContext(this.context);

    // Store additional context for all log calls
    const originalLog = childService.log.bind(childService);
    const originalError = childService.error.bind(childService);
    const originalWarn = childService.warn.bind(childService);
    const originalDebug = childService.debug.bind(childService);

    childService.log = (message: any, ctx?: LogContext) => {
      originalLog(message, { ...contextData, ...ctx });
    };

    childService.error = (message: any, trace?: string, ctx?: LogContext) => {
      originalError(message, trace, { ...contextData, ...ctx });
    };

    childService.warn = (message: any, ctx?: LogContext) => {
      originalWarn(message, { ...contextData, ...ctx });
    };

    childService.debug = (message: any, ctx?: LogContext) => {
      originalDebug(message, { ...contextData, ...ctx });
    };

    return childService;
  }

  /**
   * Get the underlying logger
   */
  getLogger(): SimpleLogger {
    return this.logger;
  }
}
