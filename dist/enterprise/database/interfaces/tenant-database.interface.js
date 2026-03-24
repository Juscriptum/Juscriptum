/**
 * Tenant Database Configuration
 * Supports dedicated database per tenant for Enterprise plans
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
    get DEFAULT_POOL_OPTIONS () {
        return DEFAULT_POOL_OPTIONS;
    },
    get ENTERPRISE_POOL_OPTIONS () {
        return ENTERPRISE_POOL_OPTIONS;
    }
});
const DEFAULT_POOL_OPTIONS = {
    min: 2,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000
};
const ENTERPRISE_POOL_OPTIONS = {
    min: 5,
    max: 50,
    idleTimeoutMillis: 60000,
    connectionTimeoutMillis: 10000
};

//# sourceMappingURL=tenant-database.interface.js.map