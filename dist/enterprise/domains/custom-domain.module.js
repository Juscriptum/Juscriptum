"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "CustomDomainModule", {
    enumerable: true,
    get: function() {
        return CustomDomainModule;
    }
});
const _common = require("@nestjs/common");
const _typeorm = require("@nestjs/typeorm");
const _customdomaincontroller = require("./controllers/custom-domain.controller");
const _customdomainservice = require("./services/custom-domain.service");
const _domainroutingmiddleware = require("./middleware/domain-routing.middleware");
const _CustomDomainentity = require("./entities/CustomDomain.entity");
const _Organizationentity = require("../../database/entities/Organization.entity");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let CustomDomainModule = class CustomDomainModule {
};
CustomDomainModule = _ts_decorate([
    (0, _common.Module)({
        imports: [
            _typeorm.TypeOrmModule.forFeature([
                _CustomDomainentity.CustomDomain,
                _Organizationentity.Organization
            ])
        ],
        controllers: [
            _customdomaincontroller.CustomDomainController
        ],
        providers: [
            _customdomainservice.CustomDomainService,
            _domainroutingmiddleware.DomainRoutingMiddleware
        ],
        exports: [
            _customdomainservice.CustomDomainService,
            _domainroutingmiddleware.DomainRoutingMiddleware
        ]
    })
], CustomDomainModule);

//# sourceMappingURL=custom-domain.module.js.map