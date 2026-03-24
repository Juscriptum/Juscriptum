"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "RegistryIndexBootstrapService", {
    enumerable: true,
    get: function() {
        return RegistryIndexBootstrapService;
    }
});
const _common = require("@nestjs/common");
const _scheduledtasks = require("../../common/runtime/scheduled-tasks");
const _registryindexservice = require("./registry-index.service");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let RegistryIndexBootstrapService = class RegistryIndexBootstrapService {
    onApplicationBootstrap() {
        if (this.warmupStarted || !(0, _scheduledtasks.shouldRunScheduledTasks)() || this.isExternalDataConfigured()) {
            return;
        }
        this.warmupStarted = true;
        const warmupSources = this.getWarmupSources();
        setTimeout(()=>{
            void this.warmupIndexes(warmupSources);
        }, 0);
    }
    getWarmupSources() {
        const configured = (process.env.REGISTRY_INDEX_WARMUP_SOURCES || "court_stan,asvp,court_dates").split(",").map((value)=>value.trim()).filter((value)=>value === "court_stan" || value === "asvp" || value === "court_dates");
        return configured.length > 0 ? configured : [
            "court_stan",
            "asvp",
            "court_dates"
        ];
    }
    async warmupIndexes(sources) {
        for (const source of sources){
            try {
                await this.registryIndexService.rebuildIndexes({
                    source
                });
            } catch (error) {
                this.logger.error(`Registry index warmup failed for ${source}: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
    }
    isExternalDataConfigured() {
        return [
            process.env.EXTERNAL_DATA_URLS_COURT_STAN,
            process.env.EXTERNAL_DATA_URLS_COURT_DATES,
            process.env.EXTERNAL_DATA_URLS_REESTR,
            process.env.EXTERNAL_DATA_URLS_ASVP
        ].some((value)=>Boolean(value?.trim()));
    }
    constructor(registryIndexService){
        this.registryIndexService = registryIndexService;
        this.logger = new _common.Logger(RegistryIndexBootstrapService.name);
        this.warmupStarted = false;
    }
};
RegistryIndexBootstrapService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _registryindexservice.RegistryIndexService === "undefined" ? Object : _registryindexservice.RegistryIndexService
    ])
], RegistryIndexBootstrapService);

//# sourceMappingURL=registry-index.bootstrap.service.js.map