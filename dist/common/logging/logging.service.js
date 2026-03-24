"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "LoggingService", {
    enumerable: true,
    get: function() {
        return LoggingService;
    }
});
const _common = require("@nestjs/common");
const _uuid = require("uuid");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
function _ts_param(paramIndex, decorator) {
    return function(target, key) {
        decorator(target, key, paramIndex);
    };
}
let LoggingService = class LoggingService {
    /**
   * Set the logging context (typically the service/class name)
   */ setContext(context) {
        this.context = context;
    }
    /**
   * Generate or retrieve request ID from context
   */ getRequestId(contextData) {
        if (contextData?.requestId) {
            return contextData.requestId;
        }
        return (0, _uuid.v4)();
    }
    /**
   * Create log metadata with context
   */ createLogMeta(contextData, additionalMeta) {
        const requestId = this.getRequestId(contextData);
        return {
            requestId,
            context: this.context,
            ...contextData,
            ...additionalMeta
        };
    }
    /**
   * Log a message at debug level
   */ debug(message, contextData) {
        const meta = this.createLogMeta(contextData);
        this.logger.debug(message, meta);
    }
    /**
   * Log a message at error level
   */ error(message, trace, contextData) {
        const meta = this.createLogMeta(contextData);
        this.logger.error(message, trace, meta);
    }
    /**
   * Log a message at info level
   */ log(message, contextData) {
        const meta = this.createLogMeta(contextData);
        this.logger.info(message, meta);
    }
    /**
   * Log a message at verbose level
   */ verbose(message, contextData) {
        const meta = this.createLogMeta(contextData);
        this.logger.verbose(message, meta);
    }
    /**
   * Log a message at warn level
   */ warn(message, contextData) {
        const meta = this.createLogMeta(contextData);
        this.logger.warn(message, meta);
    }
    /**
   * Log HTTP request/response with timing
   */ logHttpRequest(method, url, statusCode, responseTime, contextData) {
        const meta = this.createLogMeta({
            ...contextData,
            method,
            url,
            statusCode,
            responseTimeMs: responseTime
        });
        const level = statusCode >= 500 ? "error" : statusCode >= 400 ? "warn" : "info";
        this.logger.log(level, `HTTP ${method} ${url} ${statusCode} - ${responseTime}ms`, meta);
    }
    /**
   * Log database query performance
   */ logDatabaseQuery(query, duration, contextData) {
        const meta = this.createLogMeta({
            ...contextData,
            queryType: "database",
            queryLength: query.length,
            durationMs: duration
        });
        const level = duration > 1000 ? "warn" : "debug";
        this.logger.log(level, `Database query executed in ${duration}ms`, meta);
    }
    /**
   * Log business event with action and entity information
   */ logBusinessEvent(action, entity, entityId, contextData) {
        const meta = this.createLogMeta({
            ...contextData,
            action,
            entity,
            entityId,
            eventType: "business"
        });
        this.logger.info(`Business event: ${action} ${entity}${entityId ? `:${entityId}` : ""}`, meta);
    }
    /**
   * Log authentication event
   */ logAuthEvent(event, contextData) {
        const meta = this.createLogMeta({
            ...contextData,
            eventType: "auth",
            authEvent: event
        });
        const level = event === "login_failed" ? "warn" : "info";
        this.logger.log(level, `Authentication event: ${event}`, meta);
    }
    /**
   * Log security event
   */ logSecurityEvent(event, severity, contextData) {
        const meta = this.createLogMeta({
            ...contextData,
            eventType: "security",
            securityEvent: event,
            severity
        });
        const level = severity === "critical" || severity === "high" ? "error" : "warn";
        this.logger.log(level, `Security event: ${event} (severity: ${severity})`, meta);
    }
    /**
   * Log performance metrics
   */ logPerformance(operation, duration, threshold, contextData) {
        const meta = this.createLogMeta({
            ...contextData,
            eventType: "performance",
            operation,
            durationMs: duration,
            thresholdMs: threshold,
            exceededThreshold: duration > threshold
        });
        const level = duration > threshold ? "warn" : "debug";
        this.logger.log(level, `Performance: ${operation} completed in ${duration}ms`, meta);
    }
    /**
   * Log error with stack trace and context
   */ logError(error, contextData) {
        const errorMessage = error instanceof Error ? error.message : error;
        const errorStack = error instanceof Error ? error.stack : undefined;
        const meta = this.createLogMeta({
            ...contextData,
            error: errorMessage
        });
        this.logger.error(errorMessage, errorStack, meta);
    }
    /**
   * Create a child logger with additional context
   */ child(contextData) {
        const childService = new LoggingService(this.logger);
        childService.setContext(this.context);
        // Store additional context for all log calls
        const originalLog = childService.log.bind(childService);
        const originalError = childService.error.bind(childService);
        const originalWarn = childService.warn.bind(childService);
        const originalDebug = childService.debug.bind(childService);
        childService.log = (message, ctx)=>{
            originalLog(message, {
                ...contextData,
                ...ctx
            });
        };
        childService.error = (message, trace, ctx)=>{
            originalError(message, trace, {
                ...contextData,
                ...ctx
            });
        };
        childService.warn = (message, ctx)=>{
            originalWarn(message, {
                ...contextData,
                ...ctx
            });
        };
        childService.debug = (message, ctx)=>{
            originalDebug(message, {
                ...contextData,
                ...ctx
            });
        };
        return childService;
    }
    /**
   * Get the underlying logger
   */ getLogger() {
        return this.logger;
    }
    constructor(logger){
        this.logger = logger;
        this.nestLogger = new _common.Logger();
    }
};
LoggingService = _ts_decorate([
    (0, _common.Injectable)({
        scope: _common.Scope.TRANSIENT
    }),
    _ts_param(0, (0, _common.Inject)("WINSTON_LOGGER")),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof SimpleLogger === "undefined" ? Object : SimpleLogger
    ])
], LoggingService);

//# sourceMappingURL=logging.service.js.map