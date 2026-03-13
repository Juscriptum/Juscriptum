import { Module, Global } from "@nestjs/common";
import { RedisCacheService } from "./services/redis-cache.service";
import { CacheInterceptor } from "./interceptors/cache.interceptor";
import { CacheInvalidationInterceptor } from "./interceptors/cache-invalidation.interceptor";

@Global()
@Module({
  providers: [
    RedisCacheService,
    CacheInterceptor,
    CacheInvalidationInterceptor,
  ],
  exports: [RedisCacheService, CacheInterceptor, CacheInvalidationInterceptor],
})
export class RedisCacheModule {}
