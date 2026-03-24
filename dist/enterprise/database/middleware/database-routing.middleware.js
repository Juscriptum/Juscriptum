"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "DatabaseRoutingMiddleware", {
    enumerable: true,
    get: function() {
        return DatabaseRoutingMiddleware;
    }
});
const _common = require("@nestjs/common");
const _tenantdatabaseservice = require("../services/tenant-database.service");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let DatabaseRoutingMiddleware = class DatabaseRoutingMiddleware {
    async use(req, res, next) {
        const user = req.user;
        if (!user?.tenant_id) {
            return next();
        }
        try {
            // Get appropriate database connection for tenant
            const dataSource = await this.tenantDatabaseService.getConnection(user.tenant_id);
            // Attach connection to request for use in services
            req.tenantDataSource = dataSource;
            next();
        } catch (error) {
            throw new _common.UnauthorizedException("Unable to connect to tenant database");
        }
    }
    constructor(tenantDatabaseService){
        this.tenantDatabaseService = tenantDatabaseService;
    }
};
DatabaseRoutingMiddleware = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _tenantdatabaseservice.TenantDatabaseService === "undefined" ? Object : _tenantdatabaseservice.TenantDatabaseService
    ])
], DatabaseRoutingMiddleware);

//# sourceMappingURL=database-routing.middleware.js.map