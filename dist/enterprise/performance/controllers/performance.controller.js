"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "PerformanceController", {
    enumerable: true,
    get: function() {
        return PerformanceController;
    }
});
const _common = require("@nestjs/common");
const _swagger = require("@nestjs/swagger");
const _queryoptimizationservice = require("../services/query-optimization.service");
const _guards = require("../../../auth/guards");
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
let PerformanceController = class PerformanceController {
    async getStats() {
        return this.queryOptimizationService.getDatabaseStats();
    }
    async getSlowQueries(limit) {
        return {
            queries: this.queryOptimizationService.getSlowQueries(limit),
            summary: this.queryOptimizationService.getPerformanceSummary()
        };
    }
    async getIndexSuggestions(table) {
        return this.queryOptimizationService.getIndexSuggestions(table);
    }
    async vacuumAnalyze(table) {
        await this.queryOptimizationService.vacuumAnalyze(table);
        return {
            success: true,
            message: `VACUUM ANALYZE completed for ${table}`
        };
    }
    async analyzeQuery(query) {
        return this.queryOptimizationService.analyzeQueryPlan(query);
    }
    async clearSlowQueries() {
        this.queryOptimizationService.clearSlowQueryLogs();
        return {
            success: true
        };
    }
    constructor(queryOptimizationService){
        this.queryOptimizationService = queryOptimizationService;
    }
};
_ts_decorate([
    (0, _common.Get)("stats"),
    (0, _swagger.ApiOperation)({
        summary: "Get database performance statistics"
    }),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", []),
    _ts_metadata("design:returntype", Promise)
], PerformanceController.prototype, "getStats", null);
_ts_decorate([
    (0, _common.Get)("slow-queries"),
    (0, _swagger.ApiOperation)({
        summary: "Get slow query logs"
    }),
    _ts_param(0, (0, _common.Query)("limit")),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Number
    ]),
    _ts_metadata("design:returntype", Promise)
], PerformanceController.prototype, "getSlowQueries", null);
_ts_decorate([
    (0, _common.Get)("index-suggestions/:table"),
    (0, _swagger.ApiOperation)({
        summary: "Get index suggestions for table"
    }),
    _ts_param(0, (0, _common.Param)("table")),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], PerformanceController.prototype, "getIndexSuggestions", null);
_ts_decorate([
    (0, _common.Post)("analyze/:table"),
    (0, _swagger.ApiOperation)({
        summary: "Run VACUUM ANALYZE on table"
    }),
    _ts_param(0, (0, _common.Param)("table")),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], PerformanceController.prototype, "vacuumAnalyze", null);
_ts_decorate([
    (0, _common.Post)("analyze-query"),
    (0, _swagger.ApiOperation)({
        summary: "Analyze query execution plan"
    }),
    _ts_param(0, (0, _common.Query)("query")),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], PerformanceController.prototype, "analyzeQuery", null);
_ts_decorate([
    (0, _common.Delete)("slow-queries"),
    (0, _swagger.ApiOperation)({
        summary: "Clear slow query logs"
    }),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", []),
    _ts_metadata("design:returntype", Promise)
], PerformanceController.prototype, "clearSlowQueries", null);
PerformanceController = _ts_decorate([
    (0, _swagger.ApiTags)("Performance"),
    (0, _swagger.ApiBearerAuth)(),
    (0, _common.Controller)("v1/performance"),
    (0, _common.UseGuards)(_guards.JwtAuthGuard, _guards.SuperAdminGuard),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _queryoptimizationservice.QueryOptimizationService === "undefined" ? Object : _queryoptimizationservice.QueryOptimizationService
    ])
], PerformanceController);

//# sourceMappingURL=performance.controller.js.map