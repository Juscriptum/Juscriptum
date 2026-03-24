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
    get AccountActiveGuard () {
        return AccountActiveGuard;
    },
    get CombinedGuard () {
        return CombinedGuard;
    },
    get EmailVerifiedGuard () {
        return EmailVerifiedGuard;
    },
    get JwtAuthGuard () {
        return JwtAuthGuard;
    },
    get MfaGuard () {
        return MfaGuard;
    },
    get OwnerGuard () {
        return OwnerGuard;
    },
    get RbacGuard () {
        return RbacGuard;
    },
    get SubscriptionGuard () {
        return SubscriptionGuard;
    },
    get SuperAdminGuard () {
        return SuperAdminGuard;
    },
    get TenantGuard () {
        return TenantGuard;
    }
});
const _common = require("@nestjs/common");
const _core = require("@nestjs/core");
const _passport = require("@nestjs/passport");
const _accesscontroldecorators = require("../decorators/access-control.decorators");
const _subscriptionlimits = require("../../common/security/subscription-limits");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let JwtAuthGuard = class JwtAuthGuard extends (0, _passport.AuthGuard)("jwt") {
};
JwtAuthGuard = _ts_decorate([
    (0, _common.Injectable)()
], JwtAuthGuard);
let TenantGuard = class TenantGuard {
    canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user || !user.tenant_id) {
            throw new _common.UnauthorizedException("Tenant ID missing in JWT");
        }
        // Set tenant_id in request for downstream use
        request.tenantId = user.tenant_id;
        return true;
    }
    constructor(_reflector){
        this._reflector = _reflector;
    }
};
TenantGuard = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _core.Reflector === "undefined" ? Object : _core.Reflector
    ])
], TenantGuard);
let RbacGuard = class RbacGuard {
    canActivate(context) {
        const requiredRoles = this.reflector.getAllAndOverride(_accesscontroldecorators.ROLES_KEY, [
            context.getHandler(),
            context.getClass()
        ]);
        if (!requiredRoles || requiredRoles.length === 0) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user || !user.role) {
            throw new _common.UnauthorizedException("Role missing in JWT");
        }
        const hasRole = requiredRoles.includes(user.role);
        if (!hasRole) {
            throw new _common.ForbiddenException(`Доступ заборонено. Необхідно: ${requiredRoles.join(", ")}, наявно: ${user.role}`);
        }
        return true;
    }
    constructor(reflector){
        this.reflector = reflector;
    }
};
RbacGuard = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _core.Reflector === "undefined" ? Object : _core.Reflector
    ])
], RbacGuard);
let SubscriptionGuard = class SubscriptionGuard {
    canActivate(context) {
        const requiredPlan = this.reflector.getAllAndOverride(_accesscontroldecorators.REQUIRED_PLAN_KEY, [
            context.getHandler(),
            context.getClass()
        ]);
        if (!requiredPlan) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user || !user.subscription_plan) {
            throw new _common.UnauthorizedException("Subscription plan missing in JWT");
        }
        const userLevel = (0, _subscriptionlimits.getPlanLevel)(user.subscription_plan);
        const requiredLevel = (0, _subscriptionlimits.getPlanLevel)(requiredPlan);
        if (userLevel < requiredLevel) {
            throw new _common.ForbiddenException(`Ця функція доступна на тарифі ${requiredPlan}`);
        }
        return true;
    }
    constructor(reflector){
        this.reflector = reflector;
    }
};
SubscriptionGuard = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _core.Reflector === "undefined" ? Object : _core.Reflector
    ])
], SubscriptionGuard);
let OwnerGuard = class OwnerGuard {
    canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user || user.role !== "organization_owner") {
            throw new _common.ForbiddenException("Тільки власник організації може виконувати цю дію");
        }
        return true;
    }
};
OwnerGuard = _ts_decorate([
    (0, _common.Injectable)()
], OwnerGuard);
let EmailVerifiedGuard = class EmailVerifiedGuard {
    canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user) {
            throw new _common.UnauthorizedException("Unauthorized");
        }
        // Email verified status should be in JWT or fetched from DB
        const emailVerified = request.userDetails?.emailVerified ?? false;
        if (!emailVerified) {
            throw new _common.ForbiddenException("Будь ласка, підтвердіть свою електронну пошту");
        }
        return true;
    }
};
EmailVerifiedGuard = _ts_decorate([
    (0, _common.Injectable)()
], EmailVerifiedGuard);
let MfaGuard = class MfaGuard {
    canActivate(context) {
        const requireMfa = this.reflector.getAllAndOverride("requireMfa", [
            context.getHandler(),
            context.getClass()
        ]);
        if (!requireMfa) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        const mfaEnabled = request.userDetails?.mfaEnabled ?? false;
        if (!mfaEnabled) {
            throw new _common.ForbiddenException("Ця дія вимагає увімкненої двофакторної аутентифікації");
        }
        return true;
    }
    constructor(reflector){
        this.reflector = reflector;
    }
};
MfaGuard = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _core.Reflector === "undefined" ? Object : _core.Reflector
    ])
], MfaGuard);
let SuperAdminGuard = class SuperAdminGuard {
    canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (user.role !== "super_admin") {
            throw new _common.ForbiddenException("Тільки супер адміністратор має доступ до цього ресурсу");
        }
        return true;
    }
};
SuperAdminGuard = _ts_decorate([
    (0, _common.Injectable)()
], SuperAdminGuard);
let AccountActiveGuard = class AccountActiveGuard {
    canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const userDetails = request.userDetails;
        if (!userDetails) {
            throw new _common.UnauthorizedException("User details missing");
        }
        const status = userDetails.status;
        if (status === "suspended") {
            throw new _common.ForbiddenException("Ваш акаунт призупинено. Зв'яжіться з підтримкою.");
        }
        if (status === "deleted") {
            throw new _common.ForbiddenException("Ваш акаунт видалено.");
        }
        return true;
    }
};
AccountActiveGuard = _ts_decorate([
    (0, _common.Injectable)()
], AccountActiveGuard);
let CombinedGuard = class CombinedGuard {
    async canActivate(context) {
        const guards = [
            this.tenantGuard,
            this.rbacGuard,
            this.subscriptionGuard
        ];
        for (const guard of guards){
            const result = await guard.canActivate(context);
            if (!result) {
                return false;
            }
        }
        return true;
    }
    constructor(tenantGuard, rbacGuard, subscriptionGuard){
        this.tenantGuard = tenantGuard;
        this.rbacGuard = rbacGuard;
        this.subscriptionGuard = subscriptionGuard;
    }
};
CombinedGuard = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof TenantGuard === "undefined" ? Object : TenantGuard,
        typeof RbacGuard === "undefined" ? Object : RbacGuard,
        typeof SubscriptionGuard === "undefined" ? Object : SubscriptionGuard
    ])
], CombinedGuard);

//# sourceMappingURL=index.js.map