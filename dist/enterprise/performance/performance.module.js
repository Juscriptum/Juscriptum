"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "PerformanceModule", {
    enumerable: true,
    get: function() {
        return PerformanceModule;
    }
});
const _common = require("@nestjs/common");
const _performancecontroller = require("./controllers/performance.controller");
const _queryoptimizationservice = require("./services/query-optimization.service");
const _queryperformanceinterceptor = require("./interceptors/query-performance.interceptor");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let PerformanceModule = class PerformanceModule {
};
PerformanceModule = _ts_decorate([
    (0, _common.Global)(),
    (0, _common.Module)({
        controllers: [
            _performancecontroller.PerformanceController
        ],
        providers: [
            _queryoptimizationservice.QueryOptimizationService,
            _queryperformanceinterceptor.QueryPerformanceInterceptor
        ],
        exports: [
            _queryoptimizationservice.QueryOptimizationService,
            _queryperformanceinterceptor.QueryPerformanceInterceptor
        ]
    })
], PerformanceModule);

//# sourceMappingURL=performance.module.js.map