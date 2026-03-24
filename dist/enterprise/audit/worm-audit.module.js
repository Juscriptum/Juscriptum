"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "WormAuditModule", {
    enumerable: true,
    get: function() {
        return WormAuditModule;
    }
});
const _common = require("@nestjs/common");
const _typeorm = require("@nestjs/typeorm");
const _auditcontroller = require("./controllers/audit.controller");
const _wormauditservice = require("./services/worm-audit.service");
const _auditinterceptor = require("./interceptors/audit.interceptor");
const _WormAuditLogentity = require("./entities/WormAuditLog.entity");
const _Organizationentity = require("../../database/entities/Organization.entity");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let WormAuditModule = class WormAuditModule {
};
WormAuditModule = _ts_decorate([
    (0, _common.Global)(),
    (0, _common.Module)({
        imports: [
            _typeorm.TypeOrmModule.forFeature([
                _WormAuditLogentity.WormAuditLog,
                _Organizationentity.Organization
            ])
        ],
        controllers: [
            _auditcontroller.AuditController
        ],
        providers: [
            _wormauditservice.WormAuditService,
            _auditinterceptor.AuditInterceptor
        ],
        exports: [
            _wormauditservice.WormAuditService,
            _auditinterceptor.AuditInterceptor
        ]
    })
], WormAuditModule);

//# sourceMappingURL=worm-audit.module.js.map