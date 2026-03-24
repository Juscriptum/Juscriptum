/**
 * Query Optimization Configuration
 */ "use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get DEFAULT_OPTIMIZATION_CONFIG () {
        return DEFAULT_OPTIMIZATION_CONFIG;
    },
    get OPTIMIZATION_PATTERNS () {
        return OPTIMIZATION_PATTERNS;
    }
});
const DEFAULT_OPTIMIZATION_CONFIG = {
    enableQueryLogging: true,
    slowQueryThreshold: 1000,
    maxQueryTime: 30000,
    enableQueryPlan: false,
    connectionPoolSize: 10
};
const OPTIMIZATION_PATTERNS = {
    N_PLUS_ONE: "N+1 query detected",
    MISSING_INDEX: "Sequential scan on large table",
    INEFFICIENT_JOIN: "Nested loop join with large dataset",
    UNNECESSARY_SORT: "Sort without index",
    FULL_TABLE_SCAN: "Full table scan detected"
};

//# sourceMappingURL=query-optimization.interface.js.map