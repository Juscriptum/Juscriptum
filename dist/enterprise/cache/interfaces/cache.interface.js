/**
 * Redis Cache Configuration
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
    get CACHE_KEYS () {
        return CACHE_KEYS;
    },
    get DEFAULT_TTL () {
        return DEFAULT_TTL;
    },
    get LONG_TTL () {
        return LONG_TTL;
    },
    get SHORT_TTL () {
        return SHORT_TTL;
    }
});
const DEFAULT_TTL = 3600; // 1 hour
const SHORT_TTL = 60; // 1 minute
const LONG_TTL = 86400; // 24 hours
const CACHE_KEYS = {
    USER: (userId)=>`user:${userId}`,
    ORGANIZATION: (tenantId)=>`org:${tenantId}`,
    CLIENTS_LIST: (tenantId, page)=>`clients:${tenantId}:page:${page}`,
    CLIENT: (tenantId, clientId)=>`client:${tenantId}:${clientId}`,
    CASES_LIST: (tenantId, page)=>`cases:${tenantId}:page:${page}`,
    CASE: (tenantId, caseId)=>`case:${tenantId}:${caseId}`,
    DOCUMENTS_LIST: (tenantId, page)=>`docs:${tenantId}:page:${page}`,
    EVENTS_LIST: (tenantId, startDate, endDate)=>`events:${tenantId}:${startDate}:${endDate}`,
    DASHBOARD_STATS: (tenantId)=>`dashboard:${tenantId}`,
    SUBSCRIPTION: (tenantId)=>`subscription:${tenantId}`,
    RATE_LIMIT: (identifier, action)=>`ratelimit:${identifier}:${action}`,
    SESSION: (sessionId)=>`session:${sessionId}`
};

//# sourceMappingURL=cache.interface.js.map