import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { RedisCacheService } from "../services/redis-cache.service";
import { JwtPayload } from "../../../auth/interfaces/jwt.interface";
import { Request } from "express";

/**
 * Cache Invalidation Interceptor
 * Automatically invalidates cache on data mutations
 */
@Injectable()
export class CacheInvalidationInterceptor implements NestInterceptor {
  constructor(private readonly cacheService: RedisCacheService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as JwtPayload;

    return next.handle().pipe(
      tap(async () => {
        if (!user?.tenant_id) return;

        // Invalidate based on method and path
        await this.invalidateCache(request, user.tenant_id);
      }),
    );
  }

  /**
   * Invalidate relevant cache entries
   */
  private async invalidateCache(
    request: Request,
    tenantId: string,
  ): Promise<void> {
    const method = request.method;
    const path = request.route?.path || request.path;

    // Only invalidate on mutations
    if (!["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
      return;
    }

    // Invalidate by entity type
    if (path.includes("/clients")) {
      await this.cacheService.invalidateByTag(`clients:${tenantId}`);
    }
    if (path.includes("/cases")) {
      await this.cacheService.invalidateByTag(`cases:${tenantId}`);
    }
    if (path.includes("/documents")) {
      await this.cacheService.invalidateByTag(`documents:${tenantId}`);
    }
    if (path.includes("/events")) {
      await this.cacheService.invalidateByTag(`events:${tenantId}`);
    }
    if (path.includes("/invoices")) {
      await this.cacheService.invalidateByTag(`invoices:${tenantId}`);
    }
    if (path.includes("/calculations")) {
      await this.cacheService.invalidateByTag(`calculations:${tenantId}`);
    }

    // Always invalidate dashboard stats on any mutation
    await this.cacheService.del(`api:${tenantId}:/v1/dashboard:`);
  }
}
