"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "TrustVerificationWorkerService", {
    enumerable: true,
    get: function() {
        return TrustVerificationWorkerService;
    }
});
const _common = require("@nestjs/common");
const _schedule = require("@nestjs/schedule");
const _trustverificationservice = require("./trust-verification.service");
const _scheduledtasks = require("../../common/runtime/scheduled-tasks");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let TrustVerificationWorkerService = class TrustVerificationWorkerService {
    async processPendingJobs() {
        if (!(0, _scheduledtasks.shouldRunScheduledTasks)()) {
            return;
        }
        const processed = await this.trustVerificationService.processDueJobs();
        if (processed > 0) {
            this.logger.log(`Processed ${processed} trust verification job(s)`);
        }
    }
    constructor(trustVerificationService){
        this.trustVerificationService = trustVerificationService;
        this.logger = new _common.Logger(TrustVerificationWorkerService.name);
    }
};
_ts_decorate([
    (0, _schedule.Cron)(_schedule.CronExpression.EVERY_MINUTE),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", []),
    _ts_metadata("design:returntype", Promise)
], TrustVerificationWorkerService.prototype, "processPendingJobs", null);
TrustVerificationWorkerService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _trustverificationservice.TrustVerificationService === "undefined" ? Object : _trustverificationservice.TrustVerificationService
    ])
], TrustVerificationWorkerService);

//# sourceMappingURL=trust-verification-worker.service.js.map