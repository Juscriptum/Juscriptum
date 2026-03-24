"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "LoggingMiddleware", {
    enumerable: true,
    get: function() {
        return LoggingMiddleware;
    }
});
const _common = require("@nestjs/common");
const _uuid = require("uuid");
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
/**
 * HTTP methods that should be logged
 */ const LOGGABLE_METHODS = [
    _common.RequestMethod.POST,
    _common.RequestMethod.PUT,
    _common.RequestMethod.PATCH,
    _common.RequestMethod.DELETE
];
/**
 * Paths that should be excluded from logging
 */ const EXCLUDE_PATHS = [
    "/health",
    "/healthz",
    "/readiness",
    "/metrics",
    "/favicon.ico"
];
/**
 * Headers that should be excluded from logs for security
 */ const EXCLUDE_HEADERS = [
    "authorization",
    "cookie",
    "set-cookie",
    "x-api-key",
    "x-auth-token"
];
let LoggingMiddleware = class LoggingMiddleware {
    /**
   * Middleware handler
   */ use(req, res, next) {
        // Skip logging for excluded paths
        if (this.shouldExcludePath(req.path)) {
            return next();
        }
        // Generate or retrieve request ID
        const requestId = req.headers["x-request-id"] || (0, _uuid.v4)();
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
   */ shouldExcludePath(path) {
        return EXCLUDE_PATHS.some((excludedPath)=>path.startsWith(excludedPath));
    }
    /**
   * Extract context from request
   */ extractContext(req) {
        return {
            tenantId: req.tenantId,
            userId: req.userId,
            userRole: req.userRole,
            ip: this.getClientIp(req),
            userAgent: req.headers["user-agent"]
        };
    }
    /**
   * Get client IP address from request
   */ getClientIp(req) {
        return req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.headers["x-real-ip"] || req.socket.remoteAddress || "unknown";
    }
    /**
   * Sanitize headers by removing sensitive information
   */ sanitizeHeaders(headers) {
        const sanitized = {};
        for (const [key, value] of Object.entries(headers)){
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
   */ mapToRequestMethod(method) {
        const methodMap = {
            GET: _common.RequestMethod.GET,
            POST: _common.RequestMethod.POST,
            PUT: _common.RequestMethod.PUT,
            PATCH: _common.RequestMethod.PATCH,
            DELETE: _common.RequestMethod.DELETE,
            OPTIONS: _common.RequestMethod.OPTIONS,
            HEAD: _common.RequestMethod.HEAD,
            ALL: _common.RequestMethod.ALL
        };
        return methodMap[method.toUpperCase()] ?? null;
    }
    /**
   * Set up response logging
   */ setupResponseLogging(req, res, context) {
        const originalEnd = res.end.bind(res);
        const startTime = req.startTime;
        res.end = (chunk, encoding, cb)=>{
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
            return originalEnd(chunk, encoding, cb);
        };
    }
    /**
   * Log request/response details
   */ logRequestResponse(req, res, responseTime, method, context) {
        const statusCode = res.statusCode;
        const methodStr = _common.RequestMethod[method];
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
            userAgent: context.userAgent
        };
        // Extract response information
        const responseInfo = {
            statusCode,
            responseTimeMs: responseTime,
            headers: this.sanitizeHeaders(res.getHeaders())
        };
        // Log with context
        this.logger.logHttpRequest(methodStr, req.path, statusCode, responseTime, {
            ...context,
            requestId: req.requestId,
            request: requestInfo,
            response: responseInfo
        });
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
   * Determine if request should be logged
   */ shouldLogRequest(method, statusCode, responseTime) {
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
    constructor(logger){
        this.logger = logger;
    }
};
LoggingMiddleware = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _loggingservice.LoggingService === "undefined" ? Object : _loggingservice.LoggingService
    ])
], LoggingMiddleware);

//# sourceMappingURL=logging.middleware.js.map