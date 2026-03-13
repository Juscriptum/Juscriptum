/**
 * CDN Configuration
 */

export interface CdnConfig {
  enabled: boolean;
  provider: "cloudflare" | "aws_cloudfront" | "fastly" | "custom";
  domain: string;
  baseUrl: string;
  cacheTtl: number;
  staticCacheTtl: number;
  apiCacheTtl: number;
}

export interface CdnPurgeOptions {
  urls?: string[];
  tags?: string[];
  all?: boolean;
}

export interface CdnCacheRule {
  pathPattern: string;
  ttl: number;
  cacheKeyPattern?: string;
  headers?: string[];
  queryStringBehavior:
    | "include-all"
    | "exclude-all"
    | "include-list"
    | "exclude-list";
  queryStringList?: string[];
}

export const DEFAULT_CDN_CONFIG: CdnConfig = {
  enabled: true,
  provider: "cloudflare",
  domain: "",
  baseUrl: "",
  cacheTtl: 3600,
  staticCacheTtl: 86400 * 30, // 30 days
  apiCacheTtl: 60, // 1 minute
};

export const CDN_CACHE_RULES: CdnCacheRule[] = [
  {
    pathPattern: "/static/*",
    ttl: 86400 * 365, // 1 year
    queryStringBehavior: "exclude-all",
  },
  {
    pathPattern: "/assets/*",
    ttl: 86400 * 30, // 30 days
    queryStringBehavior: "exclude-all",
  },
  {
    pathPattern: "/api/v1/clients",
    ttl: 300, // 5 minutes
    queryStringBehavior: "include-list",
    queryStringList: ["page", "limit", "search"],
  },
  {
    pathPattern: "/api/v1/documents/*",
    ttl: 3600, // 1 hour
    queryStringBehavior: "exclude-all",
  },
];

// Cache tags for granular invalidation
export const CDN_CACHE_TAGS = {
  TENANT: (tenantId: string) => `tenant:${tenantId}`,
  CLIENTS: (tenantId: string) => `clients:${tenantId}`,
  CASES: (tenantId: string) => `cases:${tenantId}`,
  DOCUMENTS: (tenantId: string) => `documents:${tenantId}`,
  USER: (userId: string) => `user:${userId}`,
  STATIC: "static",
  API: "api",
};
