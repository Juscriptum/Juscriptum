/**
 * Logging Module
 *
 * Provides structured, context-aware logging for the Law Organizer application.
 *
 * Features:
 * - Multi-level logging (debug, info, warn, error, fatal)
 * - Multiple log transports (console, file, Sentry)
 * - Request/response logging with correlation IDs
 * - Automatic context propagation (tenant_id, user_id, request_id)
 * - Sensitive data redaction
 * - Performance monitoring
 * - Daily log rotation with compression
 * - Integration with existing AuditLog service
 *
 * @module common/logging
 */

export * from "./logging.module";
export * from "./logging.service";
export * from "./logging.middleware";
export * from "./logging.interceptor";
export * from "./global-exception.filter";
export * from "./logger.config";
