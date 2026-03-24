"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ExternalDataBootstrapService", {
    enumerable: true,
    get: function() {
        return ExternalDataBootstrapService;
    }
});
const _common = require("@nestjs/common");
const _scheduledtasks = require("../../common/runtime/scheduled-tasks");
const _externaldataservice = require("./external-data.service");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let ExternalDataBootstrapService = class ExternalDataBootstrapService {
    onApplicationBootstrap() {
        if (this.bootstrapStarted || !(0, _scheduledtasks.shouldRunScheduledTasks)() || !this.externalDataService.hasConfiguredSources()) {
            return;
        }
        this.bootstrapStarted = true;
        setTimeout(()=>{
            void this.runBootstrapUpdate();
        }, 0);
    }
    async runBootstrapUpdate() {
        try {
            await this.externalDataService.updateExternalData();
        } catch (error) {
            this.logger.error(`External data bootstrap update failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    constructor(externalDataService){
        this.externalDataService = externalDataService;
        this.logger = new _common.Logger(ExternalDataBootstrapService.name);
        this.bootstrapStarted = false;
    }
};
ExternalDataBootstrapService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _externaldataservice.ExternalDataService === "undefined" ? Object : _externaldataservice.ExternalDataService
    ])
], ExternalDataBootstrapService);

//# sourceMappingURL=external-data.bootstrap.service.js.map