"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "AppModule", {
    enumerable: true,
    get: function() {
        return AppModule;
    }
});
const _common = require("@nestjs/common");
const _core = require("@nestjs/core");
const _config = require("@nestjs/config");
const _typeorm = require("@nestjs/typeorm");
const _schedule = require("@nestjs/schedule");
const _throttler = require("@nestjs/throttler");
const _logging = require("./common/logging");
const _redisthrottlerstorage = require("./common/security/redis-throttler.storage");
const _legacydatetimecolumntype = require("./common/typeorm/legacy-datetime-column-type");
const _rlsinterceptor = require("./common/interceptors/rls.interceptor");
const _auth = require("./auth");
const _billing = require("./billing");
const _cases = require("./cases");
const _clients = require("./clients");
const _documents = require("./documents");
const _events = require("./events");
const _pricelists = require("./pricelists");
const _invoices = require("./invoices");
const _calculations = require("./calculations");
const _dashboard = require("./dashboard");
const _filestorage = require("./file-storage");
const _notifications = require("./notifications");
const _notes = require("./notes");
const _trustverificationmodule = require("./trust-verification/trust-verification.module");
const _externaldatamodule = require("./external-data/external-data.module");
const _platformadmin = require("./platform-admin");
const _entities = require("./database/entities");
const _health = require("./common/health");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let AppModule = class AppModule {
};
AppModule = _ts_decorate([
    (0, _common.Module)({
        imports: [
            _config.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: [
                    ".env.local",
                    ".env"
                ]
            }),
            _throttler.ThrottlerModule.forRootAsync({
                imports: [
                    _config.ConfigModule
                ],
                useFactory: async (configService)=>{
                    const storage = new _redisthrottlerstorage.RedisThrottlerStorage(configService);
                    await storage.initialize();
                    return [
                        {
                            ttl: 60000,
                            limit: 100,
                            storage
                        }
                    ];
                },
                inject: [
                    _config.ConfigService
                ]
            }),
            _schedule.ScheduleModule.forRoot(),
            _typeorm.TypeOrmModule.forRootAsync({
                imports: [
                    _config.ConfigModule
                ],
                useFactory: (configService)=>{
                    const nodeEnv = configService.get("NODE_ENV", "development");
                    const dbType = configService.get("DB_TYPE", "sqlite");
                    const forceSync = configService.get("DB_SYNC", "false") === "true" || configService.get("DB_SYNC", "false") === "1";
                    (0, _legacydatetimecolumntype.normalizeLegacyDateTimeColumnsForDatabase)(dbType);
                    if (dbType === "sqlite" || nodeEnv === "development") {
                        return {
                            type: "better-sqlite3",
                            database: configService.get("DB_NAME", "law_organizer.db"),
                            entities: [
                                ..._entities.DATABASE_ENTITIES
                            ],
                            synchronize: true,
                            logging: true
                        };
                    }
                    return {
                        type: "postgres",
                        host: configService.get("DATABASE_HOST") || configService.get("DB_HOST", "localhost"),
                        port: configService.get("DATABASE_PORT") ?? configService.get("DB_PORT", 5432),
                        username: configService.get("DATABASE_USER") || configService.get("DB_USER"),
                        password: configService.get("DATABASE_PASSWORD") ?? configService.get("DB_PASSWORD", ""),
                        database: configService.get("DATABASE_NAME") || configService.get("DB_NAME", "law_organizer"),
                        entities: [
                            ..._entities.DATABASE_ENTITIES
                        ],
                        synchronize: forceSync || nodeEnv !== "production",
                        logging: nodeEnv === "development"
                    };
                },
                inject: [
                    _config.ConfigService
                ]
            }),
            _logging.LoggingModule.register({
                enableRequestLogging: false,
                enableMethodLogging: false,
                enablePerformanceLogging: false,
                performanceThreshold: 1000
            }),
            // EnterpriseModule, // Temporarily disabled for debugging
            _auth.AuthModule,
            _billing.BillingModule,
            _cases.CasesModule,
            _clients.ClientsModule,
            _documents.DocumentsModule,
            _events.EventsModule,
            _pricelists.PricelistsModule,
            _invoices.InvoicesModule,
            _calculations.CalculationsModule,
            _dashboard.DashboardModule,
            _filestorage.FileStorageModule,
            _notifications.NotificationsModule,
            _notes.NotesModule,
            _trustverificationmodule.TrustVerificationModule,
            _platformadmin.PlatformAdminModule,
            _externaldatamodule.ExternalDataModule,
            _health.HealthModule
        ],
        providers: [
            _rlsinterceptor.RlsContextStore,
            _rlsinterceptor.RlsQueryRunnerPatcher,
            {
                provide: _core.APP_INTERCEPTOR,
                useClass: _rlsinterceptor.RlsInterceptor
            }
        ]
    })
], AppModule);

//# sourceMappingURL=app.module.js.map