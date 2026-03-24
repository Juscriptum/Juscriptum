"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "LoggingInterceptor", {
    enumerable: true,
    get: function() {
        return LoggingInterceptor;
    }
});
const _common = require("@nestjs/common");
const _rxjs = require("rxjs");
const _operators = require("rxjs/operators");
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
let LoggingInterceptor = class LoggingInterceptor {
    /**
   * Interceptor method
   */ intercept(context, next) {
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
        return next.handle().pipe((0, _operators.tap)((data)=>{
            // Log method exit
            this.logMethodExit(logContext, startTime, data);
        }), (0, _operators.catchError)((error)=>{
            // Log method error
            this.logMethodError(logContext, error);
            return (0, _rxjs.throwError)(()=>error);
        }));
    }
    /**
   * Check if request should be excluded from logging
   */ shouldExclude(request) {
        const method = request.method;
        const path = request.path;
        if (this.options.excludeMethods?.includes(method)) {
            return true;
        }
        if (this.options.excludePaths?.some((excludedPath)=>path.startsWith(excludedPath))) {
            return true;
        }
        return false;
    }
    /**
   * Extract log context from request and execution context
   */ extractLogContext(request, controller, method) {
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
            path: request.path
        };
    }
    /**
   * Get client IP address
   */ getClientIp(request) {
        return request.headers?.["x-forwarded-for"]?.split(",")[0]?.trim() || request.headers?.["x-real-ip"] || request.socket?.remoteAddress || "unknown";
    }
    /**
   * Log method entry
   */ logMethodEntry(context, request) {
        const message = `${context.controller}.${context.method} called`;
        const logData = {
            ...context,
            eventType: "method_call",
            phase: "entry"
        };
        // Add request arguments if enabled
        if (this.options.logArgs && request.body && Object.keys(request.body).length > 0) {
            logData.requestBody = this.sanitizeBody(request.body);
        }
        if (request.query && Object.keys(request.query).length > 0) {
            logData.query = this.sanitizeQuery(request.query);
        }
        this.loggingService.debug(message, logData);
    }
    /**
   * Log method exit
   */ logMethodExit(context, startTime, data) {
        const executionTime = Date.now() - startTime;
        const message = `${context.controller}.${context.method} completed in ${executionTime}ms`;
        const logData = {
            ...context,
            eventType: "method_call",
            phase: "exit",
            executionTimeMs: executionTime
        };
        // Add response data if enabled
        if (this.options.logResult && data) {
            logData.response = this.sanitizeResponse(data);
        }
        // Determine log level based on execution time
        if (this.options.logExecutionTime && executionTime > (this.options.executionTimeThreshold || 1000)) {
            // Log slow methods as warnings
            this.loggingService.warn(message, logData);
        } else {
            this.loggingService.debug(message, logData);
        }
    }
    /**
   * Log method error
   */ logMethodError(context, error) {
        const message = `${context.controller}.${context.method} failed`;
        const logData = {
            ...context,
            eventType: "method_call",
            phase: "error",
            error: error.message,
            errorName: error.name
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
   */ sanitizeBody(body) {
        if (!body || typeof body !== "object") {
            return body;
        }
        const sanitized = {};
        const sensitiveFields = [
            "password",
            "token",
            "secret",
            "apiKey",
            "creditCard",
            "ssn"
        ];
        for (const [key, value] of Object.entries(body)){
            const isSensitive = sensitiveFields.some((field)=>key.toLowerCase().includes(field.toLowerCase()));
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
   */ sanitizeQuery(query) {
        if (!query || typeof query !== "object") {
            return query;
        }
        const sanitized = {};
        const sensitiveParams = [
            "password",
            "token",
            "secret",
            "api_key",
            "authorization"
        ];
        for (const [key, value] of Object.entries(query)){
            if (sensitiveParams.some((param)=>key.toLowerCase().includes(param))) {
                sanitized[key] = "[REDACTED]";
            } else {
                sanitized[key] = value;
            }
        }
        return sanitized;
    }
    /**
   * Sanitize response data by removing sensitive fields
   */ sanitizeResponse(data) {
        if (!data || typeof data !== "object") {
            return data;
        }
        const sanitized = {};
        const sensitiveFields = [
            "password",
            "token",
            "secret",
            "accessToken",
            "refreshToken"
        ];
        for (const [key, value] of Object.entries(data)){
            const isSensitive = sensitiveFields.some((field)=>key.toLowerCase().includes(field.toLowerCase()));
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
    constructor(loggingService, options = {}){
        this.loggingService = loggingService;
        this.options = options;
        this.logger = new _common.Logger(LoggingInterceptor.name);
        this.options = {
            logExecutionTime: true,
            logArgs: false,
            logResult: false,
            logErrors: true,
            executionTimeThreshold: 1000,
            excludeMethods: [
                "GET",
                "OPTIONS"
            ],
            excludePaths: [
                "/health",
                "/healthz",
                "/readiness"
            ],
            ...options
        };
    }
};
LoggingInterceptor = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _loggingservice.LoggingService === "undefined" ? Object : _loggingservice.LoggingService,
        typeof LoggingInterceptorOptions === "undefined" ? Object : LoggingInterceptorOptions
    ])
], LoggingInterceptor);

//# sourceMappingURL=logging.interceptor.js.map