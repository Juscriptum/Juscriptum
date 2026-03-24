"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "AuditInterceptor", {
    enumerable: true,
    get: function() {
        return AuditInterceptor;
    }
});
const _common = require("@nestjs/common");
const _operators = require("rxjs/operators");
const _wormauditservice = require("../services/worm-audit.service");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let AuditInterceptor = class AuditInterceptor {
    intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user?.tenant_id) {
            return next.handle();
        }
        const handler = context.getHandler();
        const className = context.getClass().name;
        const method = request.method;
        const path = request.route?.path || request.path;
        return next.handle().pipe((0, _operators.tap)({
            next: ()=>{
                // Log successful operation
                this.logOperation(request, user, className, method, path, "success");
            },
            error: (error)=>{
                // Log failed operation
                this.logOperation(request, user, className, method, path, "failure", error.message);
            }
        }));
    }
    async logOperation(request, user, className, method, path, status, errorMessage) {
        try {
            const action = this.mapMethodToAction(method);
            const entityType = this.mapClassToEntity(className);
            await this.auditService.log({
                tenantId: user.tenant_id,
                userId: user.user_id,
                action,
                entityType,
                entityId: request.params?.id,
                newValues: method === "POST" || method === "PUT" || method === "PATCH" ? this.sanitizeBody(request.body) : undefined,
                ipAddress: request.ip,
                userAgent: request.headers["user-agent"],
                requestId: request.correlationId,
                metadata: {
                    method,
                    path,
                    status,
                    errorMessage
                }
            });
        } catch (error) {
            // Don't fail the request if audit logging fails
            console.error("Audit logging failed:", error);
        }
    }
    mapMethodToAction(method) {
        const mapping = {
            POST: "create",
            PUT: "update",
            PATCH: "update",
            DELETE: "delete",
            GET: "export"
        };
        return mapping[method] || "update";
    }
    mapClassToEntity(className) {
        // Map controller names to entity types
        const mapping = {
            ClientsController: "client",
            CasesController: "case",
            DocumentsController: "document",
            EventsController: "event",
            InvoicesController: "invoice",
            OrganizationController: "organization",
            AuthController: "auth",
            BillingController: "subscription"
        };
        return mapping[className] || className.replace("Controller", "").toLowerCase();
    }
    sanitizeBody(body) {
        if (!body) return {};
        const sanitized = {
            ...body
        };
        const sensitiveFields = [
            "password",
            "passwordConfirm",
            "currentPassword",
            "token",
            "secret"
        ];
        for (const field of sensitiveFields){
            if (sanitized[field]) {
                sanitized[field] = "[REDACTED]";
            }
        }
        return sanitized;
    }
    constructor(auditService){
        this.auditService = auditService;
    }
};
AuditInterceptor = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _wormauditservice.WormAuditService === "undefined" ? Object : _wormauditservice.WormAuditService
    ])
], AuditInterceptor);

//# sourceMappingURL=audit.interceptor.js.map