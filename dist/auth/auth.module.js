"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "AuthModule", {
    enumerable: true,
    get: function() {
        return AuthModule;
    }
});
const _common = require("@nestjs/common");
const _jwt = require("@nestjs/jwt");
const _passport = require("@nestjs/passport");
const _typeorm = require("@nestjs/typeorm");
const _config = require("@nestjs/config");
const _registryindexmodule = require("../registry-index/registry-index.module");
const _Userentity = require("../database/entities/User.entity");
const _Organizationentity = require("../database/entities/Organization.entity");
const _RefreshTokenentity = require("../database/entities/RefreshToken.entity");
const _RevokedAccessTokenentity = require("../database/entities/RevokedAccessToken.entity");
const _Subscriptionentity = require("../database/entities/Subscription.entity");
const _AuditLogentity = require("../database/entities/AuditLog.entity");
const _OnboardingProgressentity = require("../database/entities/OnboardingProgress.entity");
const _Invitationentity = require("../database/entities/Invitation.entity");
const _authservice = require("./services/auth.service");
const _jwtservice = require("./services/jwt.service");
const _organizationservice = require("./services/organization.service");
const _auditservice = require("./services/audit.service");
const _usersservice = require("./services/users.service");
const _authcontroller = require("./controllers/auth.controller");
const _organizationcontroller = require("./controllers/organization.controller");
const _userscontroller = require("./controllers/users.controller");
const _auditlogscontroller = require("./controllers/audit-logs.controller");
const _jwtstrategy = require("./strategies/jwt.strategy");
const _refreshstrategy = require("./strategies/refresh.strategy");
const _guards = require("./guards");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let AuthModule = class AuthModule {
};
AuthModule = _ts_decorate([
    (0, _common.Module)({
        imports: [
            _registryindexmodule.RegistryIndexModule,
            _typeorm.TypeOrmModule.forFeature([
                _Userentity.User,
                _Organizationentity.Organization,
                _RefreshTokenentity.RefreshToken,
                _RevokedAccessTokenentity.RevokedAccessToken,
                _Subscriptionentity.Subscription,
                _AuditLogentity.AuditLog,
                _OnboardingProgressentity.OnboardingProgress,
                _Invitationentity.Invitation
            ]),
            _passport.PassportModule,
            _jwt.JwtModule.registerAsync({
                imports: [
                    _config.ConfigModule
                ],
                useFactory: async (configService)=>{
                    const secret = configService.get("JWT_SECRET");
                    const nodeEnv = configService.get("NODE_ENV", "development");
                    // CRITICAL: Fail in production if JWT_SECRET is not set
                    if (!secret) {
                        if (nodeEnv === "production") {
                            throw new Error("FATAL: JWT_SECRET environment variable is required in production");
                        }
                        console.warn("WARNING: Using default JWT secret in development mode. Set JWT_SECRET for production!");
                    }
                    return {
                        secret: secret || "dev-only-secret-key-not-for-production",
                        signOptions: {
                            expiresIn: configService.get("JWT_ACCESS_TOKEN_EXPIRY", "15m")
                        }
                    };
                },
                inject: [
                    _config.ConfigService
                ]
            })
        ],
        controllers: [
            _authcontroller.AuthController,
            _organizationcontroller.OrganizationController,
            _userscontroller.UsersController,
            _auditlogscontroller.AuditLogsController
        ],
        providers: [
            _authservice.AuthService,
            _jwtservice.JwtService,
            _organizationservice.OrganizationService,
            _auditservice.AuditService,
            _usersservice.UsersService,
            _jwtstrategy.JwtStrategy,
            _refreshstrategy.RefreshStrategy,
            _guards.JwtAuthGuard,
            _guards.TenantGuard,
            _guards.RbacGuard,
            _guards.SubscriptionGuard,
            _guards.SuperAdminGuard
        ],
        exports: [
            _authservice.AuthService,
            _jwtservice.JwtService,
            _organizationservice.OrganizationService,
            _auditservice.AuditService,
            _usersservice.UsersService,
            _guards.JwtAuthGuard,
            _guards.TenantGuard,
            _guards.RbacGuard,
            _guards.SubscriptionGuard,
            _guards.SuperAdminGuard
        ]
    })
], AuthModule);

//# sourceMappingURL=auth.module.js.map