import { Module, Global } from "@nestjs/common";
import { TenantDatabaseModule } from "./database/tenant-database.module";
import { CustomDomainModule } from "./domains/custom-domain.module";
import { WormAuditModule } from "./audit/worm-audit.module";
import { RedisCacheModule } from "./cache/redis-cache.module";
import { PerformanceModule } from "./performance/performance.module";
import { CdnModule } from "./cdn/cdn.module";

/**
 * Enterprise Module
 * Aggregates all enterprise features:
 * - Dedicated databases per tenant
 * - Custom domains
 * - WORM audit logging
 * - Redis caching
 * - Query optimization
 * - CDN configuration
 */
@Global()
@Module({
  imports: [
    TenantDatabaseModule,
    CustomDomainModule,
    WormAuditModule,
    RedisCacheModule,
    PerformanceModule,
    CdnModule,
  ],
  exports: [
    TenantDatabaseModule,
    CustomDomainModule,
    WormAuditModule,
    RedisCacheModule,
    PerformanceModule,
    CdnModule,
  ],
})
export class EnterpriseModule {}
