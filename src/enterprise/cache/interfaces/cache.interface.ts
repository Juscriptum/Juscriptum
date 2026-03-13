/**
 * Redis Cache Configuration
 */

export interface CacheConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  keyPrefix?: string;
  ttl?: number;
  maxKeys?: number;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  tags?: string[];
}

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  totalKeys: number;
  memoryUsage: number;
}

export type CacheKeyBuilder = (...parts: string[]) => string;

export const DEFAULT_TTL = 3600; // 1 hour
export const SHORT_TTL = 60; // 1 minute
export const LONG_TTL = 86400; // 24 hours

export const CACHE_KEYS = {
  USER: (userId: string) => `user:${userId}`,
  ORGANIZATION: (tenantId: string) => `org:${tenantId}`,
  CLIENTS_LIST: (tenantId: string, page: number) =>
    `clients:${tenantId}:page:${page}`,
  CLIENT: (tenantId: string, clientId: string) =>
    `client:${tenantId}:${clientId}`,
  CASES_LIST: (tenantId: string, page: number) =>
    `cases:${tenantId}:page:${page}`,
  CASE: (tenantId: string, caseId: string) => `case:${tenantId}:${caseId}`,
  DOCUMENTS_LIST: (tenantId: string, page: number) =>
    `docs:${tenantId}:page:${page}`,
  EVENTS_LIST: (tenantId: string, startDate: string, endDate: string) =>
    `events:${tenantId}:${startDate}:${endDate}`,
  DASHBOARD_STATS: (tenantId: string) => `dashboard:${tenantId}`,
  SUBSCRIPTION: (tenantId: string) => `subscription:${tenantId}`,
  RATE_LIMIT: (identifier: string, action: string) =>
    `ratelimit:${identifier}:${action}`,
  SESSION: (sessionId: string) => `session:${sessionId}`,
};
