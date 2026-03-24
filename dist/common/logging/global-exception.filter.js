"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "GlobalExceptionFilter", {
    enumerable: true,
    get: function() {
        return GlobalExceptionFilter;
    }
});
const _common = require("@nestjs/common");
const _loggingservice = require("./logging.service");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let GlobalExceptionFilter = class GlobalExceptionFilter {
    /**
   * Exception handler
   */ catch(exception, host) {
        const ctx = host.switchToHttp();
        const request = ctx.getRequest();
        const response = ctx.getResponse();
        const statusCode = exception instanceof _common.HttpException ? exception.getStatus() : _common.HttpStatus.INTERNAL_SERVER_ERROR;
        const message = exception instanceof _common.HttpException ? exception.getResponse() : "Internal server error";
        const errorResponse = this.buildErrorResponse(exception, request, statusCode, message);
        // Log the error with context
        this.logException(exception, request, errorResponse);
        // Send error response
        response.status(statusCode).json(this.sanitizeError(errorResponse));
    }
    /**
   * Build error response object
   */ buildErrorResponse(exception, request, statusCode, message) {
        const baseResponse = {
            statusCode,
            timestamp: new Date().toISOString(),
            path: request.path,
            method: request.method,
            requestId: request.requestId,
            error: this.getErrorName(exception),
            message: typeof message === "object" ? message.message : message
        };
        // Add stack trace in development
        if (process.env.NODE_ENV !== "production") {
            if (exception instanceof Error) {
                baseResponse.stack = exception.stack;
            }
        }
        // Handle validation errors
        if (typeof message === "object" && message !== null) {
            const msgObj = message;
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
   */ getErrorName(exception) {
        if (exception instanceof _common.HttpException) {
            return exception.constructor.name;
        }
        if (exception instanceof Error) {
            return exception.constructor.name;
        }
        return "Error";
    }
    /**
   * Extract context from request for logging
   */ extractLogContext(request) {
        return {
            requestId: request.requestId,
            tenantId: request.tenantId,
            userId: request.userId,
            userRole: request.userRole,
            ip: this.getClientIp(request),
            userAgent: request.headers["user-agent"],
            method: request.method,
            path: request.path
        };
    }
    /**
   * Get client IP address from request
   */ getClientIp(request) {
        return request.headers["x-forwarded-for"]?.split(",")[0]?.trim() || request.headers["x-real-ip"] || request.socket.remoteAddress || "unknown";
    }
    /**
   * Log exception with context
   */ logException(exception, request, errorResponse) {
        const context = this.extractLogContext(request);
        const logData = {
            ...context,
            errorType: errorResponse.error,
            errorMessage: errorResponse.message,
            statusCode: errorResponse.statusCode
        };
        // Log stack trace if available
        if (exception instanceof Error && exception.stack) {
            logData.stack = exception.stack;
        }
        // Log at appropriate level
        const statusCode = errorResponse.statusCode;
        if (statusCode >= 500) {
            // Server errors
            this.logger.error(`Server Error: ${errorResponse.error}`, exception instanceof Error ? exception.stack : undefined, logData);
        } else if (statusCode >= 400) {
            // Client errors
            this.logger.warn(`Client Error: ${errorResponse.error}`, logData);
            this.logSecurityViolation(statusCode, errorResponse, context);
        } else {
            // Other errors
            this.logger.error(`Error: ${errorResponse.error}`, exception instanceof Error ? exception.stack : undefined, logData);
        }
        // Log to error log file specifically
        this.logger.logHttpRequest(request.method, request.path, statusCode, request.startTime ? Date.now() - request.startTime : 0, context);
    }
    logSecurityViolation(statusCode, errorResponse, context) {
        if (statusCode !== _common.HttpStatus.FORBIDDEN) {
            return;
        }
        const message = Array.isArray(errorResponse.message) ? errorResponse.message.join(" ") : String(errorResponse.message ?? "");
        const normalized = message.toLowerCase();
        if (normalized.includes("tenant context")) {
            this.logger.logSecurityEvent("tenant_context_violation_detected", "high", {
                ...context,
                errorMessage: message
            });
            return;
        }
        if (normalized.includes("ізоляції даних") || normalized.includes("доступ до запису обмежено")) {
            this.logger.logSecurityEvent("data_isolation_violation_detected", "high", {
                ...context,
                errorMessage: message
            });
            return;
        }
    }
    /**
   * Sanitize error response for production
   * Remove sensitive information
   */ sanitizeError(errorResponse) {
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
   */ setLogger(logger) {
        this.logger = logger;
    }
    constructor(logger){
        this.logger = logger;
    }
};
GlobalExceptionFilter = _ts_decorate([
    (0, _common.Catch)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _loggingservice.LoggingService === "undefined" ? Object : _loggingservice.LoggingService
    ])
], GlobalExceptionFilter);

//# sourceMappingURL=global-exception.filter.js.map