"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "CdnService", {
    enumerable: true,
    get: function() {
        return CdnService;
    }
});
const _common = require("@nestjs/common");
const _config = require("@nestjs/config");
const _axios = /*#__PURE__*/ _interop_require_default(require("axios"));
const _cdninterface = require("../interfaces/cdn.interface");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let CdnService = class CdnService {
    /**
   * Check if CDN is enabled
   */ isEnabled() {
        return this.config.enabled && !!this.config.domain;
    }
    /**
   * Get CDN URL for asset
   */ getCdnUrl(path) {
        if (!this.isEnabled()) {
            return path;
        }
        // Ensure path starts with /
        const normalizedPath = path.startsWith("/") ? path : `/${path}`;
        return `${this.config.baseUrl}${normalizedPath}`;
    }
    /**
   * Purge CDN cache
   */ async purge(options) {
        if (!this.isEnabled()) {
            return {
                success: true,
                purged: 0
            };
        }
        try {
            switch(this.config.provider){
                case "cloudflare":
                    return await this.purgeCloudflare(options);
                case "aws_cloudfront":
                    return await this.purgeCloudFront(options);
                case "fastly":
                    return await this.purgeFastly(options);
                default:
                    return await this.purgeCustom(options);
            }
        } catch (error) {
            this.logger.error("CDN purge failed:", error);
            return {
                success: false,
                purged: 0
            };
        }
    }
    /**
   * Purge Cloudflare cache
   */ async purgeCloudflare(options) {
        const zoneId = this.configService.get("CLOUDFLARE_ZONE_ID");
        const apiToken = this.configService.get("CLOUDFLARE_API_TOKEN");
        if (!zoneId || !apiToken) {
            this.logger.warn("Cloudflare credentials not configured");
            return {
                success: false,
                purged: 0
            };
        }
        const purgeData = {};
        if (options.all) {
            purgeData.purge_everything = true;
        } else if (options.tags && options.tags.length > 0) {
            purgeData.tags = options.tags;
        } else if (options.urls && options.urls.length > 0) {
            purgeData.files = options.urls.map((url)=>url.startsWith("http") ? url : `${this.config.baseUrl}${url}`);
        }
        const response = await this.httpClient.post(`https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`, purgeData, {
            headers: {
                Authorization: `Bearer ${apiToken}`,
                "Content-Type": "application/json"
            }
        });
        const success = response.data.success;
        const purged = success ? options.urls?.length || options.tags?.length || 1 : 0;
        this.logger.log(`Cloudflare purge: ${success ? "success" : "failed"}, purged: ${purged}`);
        return {
            success,
            purged
        };
    }
    /**
   * Purge CloudFront cache
   */ async purgeCloudFront(options) {
        // CloudFront uses AWS SDK - this is a placeholder
        // In production, use @aws-sdk/client-cloudfront
        this.logger.log("CloudFront purge requested (implement with AWS SDK)");
        if (options.all) {
            // Create invalidation for all paths
            return {
                success: true,
                purged: 1
            };
        }
        const paths = options.urls?.map((url)=>url.startsWith("/") ? url : `/${url}`) || [
            "/*"
        ];
        return {
            success: true,
            purged: paths.length
        };
    }
    /**
   * Purge Fastly cache
   */ async purgeFastly(options) {
        const serviceId = this.configService.get("FASTLY_SERVICE_ID");
        const apiKey = this.configService.get("FASTLY_API_KEY");
        if (!serviceId || !apiKey) {
            this.logger.warn("Fastly credentials not configured");
            return {
                success: false,
                purged: 0
            };
        }
        if (options.all) {
            await this.httpClient.post(`https://api.fastly.com/service/${serviceId}/purge_all`, {}, {
                headers: {
                    "Fastly-Key": apiKey,
                    Accept: "application/json"
                }
            });
            return {
                success: true,
                purged: 1
            };
        }
        if (options.tags && options.tags.length > 0) {
            await this.httpClient.post(`https://api.fastly.com/service/${serviceId}/purge`, {
                surrogate_keys: options.tags
            }, {
                headers: {
                    "Fastly-Key": apiKey,
                    Accept: "application/json"
                }
            });
            return {
                success: true,
                purged: options.tags.length
            };
        }
        // Purge individual URLs
        let purged = 0;
        for (const url of options.urls || []){
            await this.httpClient.request({
                method: "PURGE",
                url: url.startsWith("http") ? url : `${this.config.baseUrl}${url}`
            });
            purged++;
        }
        return {
            success: true,
            purged
        };
    }
    /**
   * Purge custom CDN cache
   */ async purgeCustom(options) {
        const purgeEndpoint = this.configService.get("CDN_PURGE_ENDPOINT");
        if (!purgeEndpoint) {
            this.logger.warn("Custom CDN purge endpoint not configured");
            return {
                success: false,
                purged: 0
            };
        }
        const response = await this.httpClient.post(purgeEndpoint, {
            urls: options.urls,
            tags: options.tags,
            all: options.all
        });
        return {
            success: response.status === 200,
            purged: response.data?.purged || options.urls?.length || 0
        };
    }
    /**
   * Purge tenant cache
   */ async purgeTenantCache(tenantId) {
        const tags = [
            _cdninterface.CDN_CACHE_TAGS.TENANT(tenantId),
            _cdninterface.CDN_CACHE_TAGS.CLIENTS(tenantId),
            _cdninterface.CDN_CACHE_TAGS.CASES(tenantId),
            _cdninterface.CDN_CACHE_TAGS.DOCUMENTS(tenantId)
        ];
        return this.purge({
            tags
        });
    }
    /**
   * Purge static assets cache
   */ async purgeStaticCache() {
        return this.purge({
            urls: [
                "/static/*",
                "/assets/*"
            ]
        });
    }
    /**
   * Get cache headers for response
   */ getCacheHeaders(path, tenantId) {
        const rule = this.findMatchingRule(path);
        const headers = {};
        if (rule) {
            headers["Cache-Control"] = `public, max-age=${rule.ttl}`;
            if (tenantId) {
                headers["Surrogate-Key"] = `${_cdninterface.CDN_CACHE_TAGS.TENANT(tenantId)}`;
            }
        } else {
            // Default: short cache for API responses
            headers["Cache-Control"] = `public, max-age=${this.config.apiCacheTtl}`;
        }
        // Add CDN-specific headers
        if (this.config.provider === "cloudflare") {
            headers["CF-Cache-Status"] = "HIT";
        }
        return headers;
    }
    /**
   * Find matching cache rule for path
   */ findMatchingRule(path) {
        return _cdninterface.CDN_CACHE_RULES.find((rule)=>{
            const pattern = rule.pathPattern.replace(/\*/g, ".*");
            const regex = new RegExp(`^${pattern}$`);
            return regex.test(path);
        });
    }
    /**
   * Generate cache key for request
   */ generateCacheKey(path, tenantId, queryString) {
        const rule = this.findMatchingRule(path);
        let key = `${tenantId}:${path}`;
        if (queryString && rule) {
            const { queryStringBehavior, queryStringList } = rule;
            switch(queryStringBehavior){
                case "include-all":
                    key += `:${JSON.stringify(queryString)}`;
                    break;
                case "include-list":
                    if (queryStringList?.length) {
                        const filtered = queryStringList.reduce((acc, param)=>{
                            if (queryString[param] !== undefined) {
                                acc[param] = queryString[param];
                            }
                            return acc;
                        }, {});
                        key += `:${JSON.stringify(filtered)}`;
                    }
                    break;
            }
        }
        return key;
    }
    /**
   * Get CDN configuration
   */ getConfig() {
        return {
            ...this.config
        };
    }
    /**
   * Prefetch URLs to warm cache
   */ async warmCache(urls) {
        if (!this.isEnabled()) {
            return {
                success: true,
                warmed: 0
            };
        }
        let warmed = 0;
        for (const url of urls){
            try {
                await this.httpClient.get(url.startsWith("http") ? url : `${this.config.baseUrl}${url}`);
                warmed++;
            } catch (error) {
                this.logger.warn(`Cache warm failed for ${url}`);
            }
        }
        return {
            success: true,
            warmed
        };
    }
    constructor(configService){
        this.configService = configService;
        this.logger = new _common.Logger(CdnService.name);
        this.config = {
            ..._cdninterface.DEFAULT_CDN_CONFIG,
            enabled: this.configService.get("CDN_ENABLED", true),
            provider: this.configService.get("CDN_PROVIDER", "cloudflare"),
            domain: this.configService.get("CDN_DOMAIN", ""),
            baseUrl: this.configService.get("CDN_BASE_URL", "")
        };
        this.httpClient = _axios.default.create({
            timeout: 30000
        });
    }
};
CdnService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _config.ConfigService === "undefined" ? Object : _config.ConfigService
    ])
], CdnService);

//# sourceMappingURL=cdn.service.js.map