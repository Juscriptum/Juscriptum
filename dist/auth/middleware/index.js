"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get CorrelationIdMiddleware () {
        return CorrelationIdMiddleware;
    },
    get PasswordChangeCheckMiddleware () {
        return PasswordChangeCheckMiddleware;
    },
    get RateLimitMiddleware () {
        return RateLimitMiddleware;
    },
    get RequestLoggingMiddleware () {
        return RequestLoggingMiddleware;
    },
    get TenantContextMiddleware () {
        return TenantContextMiddleware;
    },
    get XssProtectionMiddleware () {
        return XssProtectionMiddleware;
    }
});
const _common = require("@nestjs/common");
const _validationutil = require("../../common/utils/validation.util");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let RateLimitMiddleware = class RateLimitMiddleware {
    async use(req, res, next) {
        const identifier = this.getIdentifier(req);
        const action = this.getAction(req);
        const tenantId = req.user?.tenant_id;
        const key = (0, _validationutil.generateRateLimitKey)(identifier, action, tenantId);
        const now = Date.now();
        const window = 15 * 60 * 1000; // 15 minutes
        const maxAttempts = 5;
        const record = this.rateLimitStore.get(key);
        if (!record || now > record.resetTime) {
            this.rateLimitStore.set(key, {
                count: 1,
                resetTime: now + window
            });
            return next();
        }
        if (record.count >= maxAttempts) {
            const remainingTime = Math.ceil((record.resetTime - now) / 1000 / 60);
            throw new _common.ForbiddenException(`Забагато спроб. Спробуйте через ${remainingTime} хвилин.`);
        }
        record.count++;
        this.rateLimitStore.set(key, record);
        // Add rate limit headers
        res.setHeader("X-RateLimit-Limit", maxAttempts);
        res.setHeader("X-RateLimit-Remaining", maxAttempts - record.count);
        res.setHeader("X-RateLimit-Reset", record.resetTime);
        next();
    }
    getIdentifier(req) {
        return req.user?.user_id || req.ip || "unknown";
    }
    getAction(req) {
        return `${req.method}:${req.route?.path || req.path}`;
    }
    constructor(){
        this.rateLimitStore = new Map();
    }
};
RateLimitMiddleware = _ts_decorate([
    (0, _common.Injectable)()
], RateLimitMiddleware);
let TenantContextMiddleware = class TenantContextMiddleware {
    use(req, res, next) {
        const user = req.user;
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
};
TenantContextMiddleware = _ts_decorate([
    (0, _common.Injectable)()
], TenantContextMiddleware);
let RequestLoggingMiddleware = class RequestLoggingMiddleware {
    use(req, res, next) {
        const start = Date.now();
        res.on("finish", ()=>{
            const duration = Date.now() - start;
            const user = req.user;
            const logData = {
                method: req.method,
                path: req.path,
                statusCode: res.statusCode,
                duration: `${duration}ms`,
                userId: user?.user_id,
                tenantId: user?.tenant_id,
                ip: req.ip,
                userAgent: req.get("user-agent")
            };
            console.log(JSON.stringify(logData));
        });
        next();
    }
};
RequestLoggingMiddleware = _ts_decorate([
    (0, _common.Injectable)()
], RequestLoggingMiddleware);
let XssProtectionMiddleware = class XssProtectionMiddleware {
    use(req, res, next) {
        // Set security headers
        res.setHeader("X-XSS-Protection", "1; mode=block");
        res.setHeader("X-Content-Type-Options", "nosniff");
        res.setHeader("X-Frame-Options", "DENY");
        res.setHeader("Content-Security-Policy", "default-src 'self'");
        res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
        next();
    }
};
XssProtectionMiddleware = _ts_decorate([
    (0, _common.Injectable)()
], XssProtectionMiddleware);
let CorrelationIdMiddleware = class CorrelationIdMiddleware {
    use(req, res, next) {
        const correlationId = req.headers["x-correlation-id"] || `req_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        req.correlationId = correlationId;
        res.setHeader("X-Correlation-ID", correlationId);
        next();
    }
};
CorrelationIdMiddleware = _ts_decorate([
    (0, _common.Injectable)()
], CorrelationIdMiddleware);
let PasswordChangeCheckMiddleware = class PasswordChangeCheckMiddleware {
    use(req, res, next) {
        const user = req.user;
        const userDetails = req.userDetails;
        if (!userDetails) {
            return next();
        }
        // Check if password was changed recently (e.g., 90 days)
        if (userDetails.lastPasswordChangeAt) {
            const daysSinceChange = Math.floor((Date.now() - userDetails.lastPasswordChangeAt.getTime()) / (1000 * 60 * 60 * 24));
            if (daysSinceChange > 90) {
                // Add warning header (don't block request)
                res.setHeader("X-Password-Warning", "password-expiring-soon");
            }
        }
        next();
    }
};
PasswordChangeCheckMiddleware = _ts_decorate([
    (0, _common.Injectable)()
], PasswordChangeCheckMiddleware);

//# sourceMappingURL=index.js.map