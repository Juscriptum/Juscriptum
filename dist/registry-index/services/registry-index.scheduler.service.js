"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "RegistryIndexSchedulerService", {
    enumerable: true,
    get: function() {
        return RegistryIndexSchedulerService;
    }
});
const _common = require("@nestjs/common");
const _schedule = require("@nestjs/schedule");
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
let RegistryIndexSchedulerService = class RegistryIndexSchedulerService {
    async rebuildRegistryIndexesIfNeeded() {
        if (!(0, _scheduledtasks.shouldRunScheduledTasks)() || this.isExternalDataCronConfigured()) {
            return;
        }
        await this.registryIndexService.rebuildIndexes();
    }
    isExternalDataCronConfigured() {
        return [
            process.env.EXTERNAL_DATA_URLS_COURT_STAN,
            process.env.EXTERNAL_DATA_URLS_COURT_DATES,
            process.env.EXTERNAL_DATA_URLS_REESTR,
            process.env.EXTERNAL_DATA_URLS_ASVP
        ].some((value)=>Boolean(value?.trim()));
    }
    constructor(registryIndexService){
        this.registryIndexService = registryIndexService;
    }
};
_ts_decorate([
    (0, _schedule.Cron)("0 0 10 * * *", {
        timeZone: "Etc/GMT-1"
    }),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", []),
    _ts_metadata("design:returntype", Promise)
], RegistryIndexSchedulerService.prototype, "rebuildRegistryIndexesIfNeeded", null);
RegistryIndexSchedulerService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _registryindexservice.RegistryIndexService === "undefined" ? Object : _registryindexservice.RegistryIndexService
    ])
], RegistryIndexSchedulerService);

//# sourceMappingURL=registry-index.scheduler.service.js.map