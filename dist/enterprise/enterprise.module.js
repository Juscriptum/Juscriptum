"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "EnterpriseModule", {
    enumerable: true,
    get: function() {
        return EnterpriseModule;
    }
});
const _common = require("@nestjs/common");
const _tenantdatabasemodule = require("./database/tenant-database.module");
const _customdomainmodule = require("./domains/custom-domain.module");
const _wormauditmodule = require("./audit/worm-audit.module");
const _rediscachemodule = require("./cache/redis-cache.module");
const _performancemodule = require("./performance/performance.module");
const _cdnmodule = require("./cdn/cdn.module");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let EnterpriseModule = class EnterpriseModule {
};
EnterpriseModule = _ts_decorate([
    (0, _common.Global)(),
    (0, _common.Module)({
        imports: [
            _tenantdatabasemodule.TenantDatabaseModule,
            _customdomainmodule.CustomDomainModule,
            _wormauditmodule.WormAuditModule,
            _rediscachemodule.RedisCacheModule,
            _performancemodule.PerformanceModule,
            _cdnmodule.CdnModule
        ],
        exports: [
            _tenantdatabasemodule.TenantDatabaseModule,
            _customdomainmodule.CustomDomainModule,
            _wormauditmodule.WormAuditModule,
            _rediscachemodule.RedisCacheModule,
            _performancemodule.PerformanceModule,
            _cdnmodule.CdnModule
        ]
    })
], EnterpriseModule);

//# sourceMappingURL=enterprise.module.js.map