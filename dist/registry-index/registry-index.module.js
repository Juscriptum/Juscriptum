"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "RegistryIndexModule", {
    enumerable: true,
    get: function() {
        return RegistryIndexModule;
    }
});
const _common = require("@nestjs/common");
const _registryindexbootstrapservice = require("./services/registry-index.bootstrap.service");
const _registryindexservice = require("./services/registry-index.service");
const _registryindexschedulerservice = require("./services/registry-index.scheduler.service");
const _registryindexsourcemonitorservice = require("./services/registry-index.source-monitor.service");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let RegistryIndexModule = class RegistryIndexModule {
};
RegistryIndexModule = _ts_decorate([
    (0, _common.Module)({
        providers: [
            _registryindexservice.RegistryIndexService,
            _registryindexschedulerservice.RegistryIndexSchedulerService,
            _registryindexbootstrapservice.RegistryIndexBootstrapService,
            _registryindexsourcemonitorservice.RegistryIndexSourceMonitorService
        ],
        exports: [
            _registryindexservice.RegistryIndexService
        ]
    })
], RegistryIndexModule);

//# sourceMappingURL=registry-index.module.js.map