"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "HealthController", {
    enumerable: true,
    get: function() {
        return HealthController;
    }
});
const _common = require("@nestjs/common");
const _express = require("express");
const _operationalmonitoringservice = require("./operational-monitoring.service");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
function _ts_param(paramIndex, decorator) {
    return function(target, key) {
        decorator(target, key, paramIndex);
    };
}
let HealthController = class HealthController {
    async check() {
        return this.operationalMonitoringService.getLivenessReport();
    }
    async readiness(response) {
        const report = await this.operationalMonitoringService.getReadinessReport();
        if (report.status !== "ok") {
            response.status(_common.HttpStatus.SERVICE_UNAVAILABLE);
        }
        return report;
    }
    constructor(operationalMonitoringService){
        this.operationalMonitoringService = operationalMonitoringService;
    }
};
_ts_decorate([
    (0, _common.Get)("health"),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", []),
    _ts_metadata("design:returntype", Promise)
], HealthController.prototype, "check", null);
_ts_decorate([
    (0, _common.Get)("readiness"),
    _ts_param(0, (0, _common.Res)({
        passthrough: true
    })),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _express.Response === "undefined" ? Object : _express.Response
    ]),
    _ts_metadata("design:returntype", Promise)
], HealthController.prototype, "readiness", null);
HealthController = _ts_decorate([
    (0, _common.Controller)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _operationalmonitoringservice.OperationalMonitoringService === "undefined" ? Object : _operationalmonitoringservice.OperationalMonitoringService
    ])
], HealthController);

//# sourceMappingURL=health.controller.js.map