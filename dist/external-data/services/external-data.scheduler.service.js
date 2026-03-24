"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ExternalDataSchedulerService", {
    enumerable: true,
    get: function() {
        return ExternalDataSchedulerService;
    }
});
const _common = require("@nestjs/common");
const _schedule = require("@nestjs/schedule");
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
let ExternalDataSchedulerService = class ExternalDataSchedulerService {
    async updateExternalDataDaily() {
        if (!(0, _scheduledtasks.shouldRunScheduledTasks)()) {
            return;
        }
        await this.externalDataService.updateExternalData();
    }
    constructor(externalDataService){
        this.externalDataService = externalDataService;
    }
};
_ts_decorate([
    (0, _schedule.Cron)("0 0 10 * * *", {
        timeZone: "Etc/GMT-1"
    }),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", []),
    _ts_metadata("design:returntype", Promise)
], ExternalDataSchedulerService.prototype, "updateExternalDataDaily", null);
ExternalDataSchedulerService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _externaldataservice.ExternalDataService === "undefined" ? Object : _externaldataservice.ExternalDataService
    ])
], ExternalDataSchedulerService);

//# sourceMappingURL=external-data.scheduler.service.js.map