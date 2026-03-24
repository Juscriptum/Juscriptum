/**
 * CDN Configuration
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
    get CDN_CACHE_RULES () {
        return CDN_CACHE_RULES;
    },
    get CDN_CACHE_TAGS () {
        return CDN_CACHE_TAGS;
    },
    get DEFAULT_CDN_CONFIG () {
        return DEFAULT_CDN_CONFIG;
    }
});
const DEFAULT_CDN_CONFIG = {
    enabled: true,
    provider: "cloudflare",
    domain: "",
    baseUrl: "",
    cacheTtl: 3600,
    staticCacheTtl: 86400 * 30,
    apiCacheTtl: 60
};
const CDN_CACHE_RULES = [
    {
        pathPattern: "/static/*",
        ttl: 86400 * 365,
        queryStringBehavior: "exclude-all"
    },
    {
        pathPattern: "/assets/*",
        ttl: 86400 * 30,
        queryStringBehavior: "exclude-all"
    },
    {
        pathPattern: "/api/v1/clients",
        ttl: 300,
        queryStringBehavior: "include-list",
        queryStringList: [
            "page",
            "limit",
            "search"
        ]
    },
    {
        pathPattern: "/api/v1/documents/*",
        ttl: 3600,
        queryStringBehavior: "exclude-all"
    }
];
const CDN_CACHE_TAGS = {
    TENANT: (tenantId)=>`tenant:${tenantId}`,
    CLIENTS: (tenantId)=>`clients:${tenantId}`,
    CASES: (tenantId)=>`cases:${tenantId}`,
    DOCUMENTS: (tenantId)=>`documents:${tenantId}`,
    USER: (userId)=>`user:${userId}`,
    STATIC: "static",
    API: "api"
};

//# sourceMappingURL=cdn.interface.js.map