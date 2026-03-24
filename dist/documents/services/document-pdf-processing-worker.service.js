"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "DocumentPdfProcessingWorkerService", {
    enumerable: true,
    get: function() {
        return DocumentPdfProcessingWorkerService;
    }
});
const _common = require("@nestjs/common");
const _schedule = require("@nestjs/schedule");
const _scheduledtasks = require("../../common/runtime/scheduled-tasks");
const _documentservice = require("./document.service");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let DocumentPdfProcessingWorkerService = class DocumentPdfProcessingWorkerService {
    async processPendingPdfJobs() {
        if (!(0, _scheduledtasks.shouldRunScheduledTasks)()) {
            return;
        }
        const processed = await this.documentService.processDuePdfJobs(1);
        if (processed > 0) {
            this.logger.log(`Processed ${processed} PDF post-processing job(s)`);
        }
    }
    constructor(documentService){
        this.documentService = documentService;
        this.logger = new _common.Logger(DocumentPdfProcessingWorkerService.name);
    }
};
_ts_decorate([
    (0, _schedule.Cron)(_schedule.CronExpression.EVERY_10_SECONDS),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", []),
    _ts_metadata("design:returntype", Promise)
], DocumentPdfProcessingWorkerService.prototype, "processPendingPdfJobs", null);
DocumentPdfProcessingWorkerService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _documentservice.DocumentService === "undefined" ? Object : _documentservice.DocumentService
    ])
], DocumentPdfProcessingWorkerService);

//# sourceMappingURL=document-pdf-processing-worker.service.js.map