"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "QueryPerformanceInterceptor", {
    enumerable: true,
    get: function() {
        return QueryPerformanceInterceptor;
    }
});
const _common = require("@nestjs/common");
const _operators = require("rxjs/operators");
const _queryoptimizationservice = require("../services/query-optimization.service");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let QueryPerformanceInterceptor = class QueryPerformanceInterceptor {
    intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        const startTime = Date.now();
        return next.handle().pipe((0, _operators.tap)({
            complete: ()=>{
                const duration = Date.now() - startTime;
                if (duration > this.slowQueryThreshold) {
                    this.logSlowRequest(request, duration, user);
                }
            }
        }));
    }
    /**
   * Log slow request for analysis
   */ logSlowRequest(request, duration, user) {
        const requestInfo = {
            method: request.method,
            path: request.route?.path || request.path,
            query: request.query,
            params: request.params,
            userAgent: request.headers["user-agent"]
        };
        console.warn({
            type: "slow_request",
            duration,
            tenantId: user?.tenant_id,
            userId: user?.user_id,
            request: requestInfo,
            timestamp: new Date().toISOString()
        });
    }
    constructor(queryOptimizationService){
        this.queryOptimizationService = queryOptimizationService;
        this.slowQueryThreshold = parseInt(process.env.SLOW_QUERY_THRESHOLD || "1000", 10);
    }
};
QueryPerformanceInterceptor = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _queryoptimizationservice.QueryOptimizationService === "undefined" ? Object : _queryoptimizationservice.QueryOptimizationService
    ])
], QueryPerformanceInterceptor);

//# sourceMappingURL=query-performance.interceptor.js.map