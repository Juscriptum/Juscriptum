"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "PlatformAdminModule", {
    enumerable: true,
    get: function() {
        return PlatformAdminModule;
    }
});
const _common = require("@nestjs/common");
const _config = require("@nestjs/config");
const _jwt = require("@nestjs/jwt");
const _passport = require("@nestjs/passport");
const _typeorm = require("@nestjs/typeorm");
const _entities = require("../database/entities");
const _platformadminauthcontroller = require("./controllers/platform-admin-auth.controller");
const _platformadminblueprintcontroller = require("./controllers/platform-admin-blueprint.controller");
const _platformadmindashboardcontroller = require("./controllers/platform-admin-dashboard.controller");
const _platformadminorganizationscontroller = require("./controllers/platform-admin-organizations.controller");
const _guards = require("./guards");
const _services = require("./services");
const _platformadminjwtstrategy = require("./strategies/platform-admin-jwt.strategy");
const _health = require("../common/health");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let PlatformAdminModule = class PlatformAdminModule {
};
PlatformAdminModule = _ts_decorate([
    (0, _common.Module)({
        imports: [
            _health.HealthModule,
            _typeorm.TypeOrmModule.forFeature([
                _entities.Organization,
                _entities.User,
                _entities.Subscription,
                _entities.Document,
                _entities.AuditLog,
                _entities.PlatformAdminUser,
                _entities.PlatformAdminRefreshToken,
                _entities.PlatformAdminRevokedAccessToken
            ]),
            _passport.PassportModule,
            _jwt.JwtModule.registerAsync({
                imports: [
                    _config.ConfigModule
                ],
                useFactory: async (configService)=>{
                    const secret = configService.get("PLATFORM_ADMIN_JWT_SECRET");
                    const nodeEnv = configService.get("NODE_ENV", "development");
                    if (!secret && nodeEnv === "production") {
                        throw new Error("FATAL: PLATFORM_ADMIN_JWT_SECRET environment variable is required in production");
                    }
                    if (!secret) {
                        console.warn("WARNING: Using default platform-admin JWT secret in development mode. Set PLATFORM_ADMIN_JWT_SECRET for production!");
                    }
                    return {
                        secret: secret || "platform-admin-dev-only-secret-not-for-production",
                        signOptions: {
                            expiresIn: configService.get("PLATFORM_ADMIN_JWT_ACCESS_TOKEN_EXPIRY", "15m")
                        }
                    };
                },
                inject: [
                    _config.ConfigService
                ]
            })
        ],
        controllers: [
            _platformadminauthcontroller.PlatformAdminAuthController,
            _platformadminblueprintcontroller.PlatformAdminBlueprintController,
            _platformadmindashboardcontroller.PlatformAdminDashboardController,
            _platformadminorganizationscontroller.PlatformAdminOrganizationsController
        ],
        providers: [
            _services.PlatformAdminAuthService,
            _services.PlatformAdminJwtService,
            _services.PlatformAdminReadService,
            _platformadminjwtstrategy.PlatformAdminJwtStrategy,
            _guards.PlatformAdminJwtAuthGuard
        ],
        exports: [
            _services.PlatformAdminAuthService,
            _guards.PlatformAdminJwtAuthGuard,
            _services.PlatformAdminReadService
        ]
    })
], PlatformAdminModule);

//# sourceMappingURL=platform-admin.module.js.map