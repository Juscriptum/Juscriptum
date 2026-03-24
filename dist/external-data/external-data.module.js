"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ExternalDataModule", {
    enumerable: true,
    get: function() {
        return ExternalDataModule;
    }
});
const _common = require("@nestjs/common");
const _registryindexmodule = require("../registry-index/registry-index.module");
const _externaldataconstants = require("./external-data.constants");
const _externaldatabootstrapservice = require("./services/external-data.bootstrap.service");
const _externaldataschedulerservice = require("./services/external-data.scheduler.service");
const _externaldataservice = require("./services/external-data.service");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let ExternalDataModule = class ExternalDataModule {
};
ExternalDataModule = _ts_decorate([
    (0, _common.Module)({
        imports: [
            _registryindexmodule.RegistryIndexModule
        ],
        providers: [
            {
                provide: _externaldataconstants.EXTERNAL_DATA_SOURCE_DEFINITIONS,
                useFactory: ()=>(0, _externaldataconstants.buildDefaultExternalDataDefinitions)()
            },
            _externaldataservice.ExternalDataService,
            _externaldatabootstrapservice.ExternalDataBootstrapService,
            _externaldataschedulerservice.ExternalDataSchedulerService
        ],
        exports: [
            _externaldataservice.ExternalDataService
        ]
    })
], ExternalDataModule);

//# sourceMappingURL=external-data.module.js.map