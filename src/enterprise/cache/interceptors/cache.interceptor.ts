import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Observable, of } from "rxjs";
import { tap } from "rxjs/operators";
import { RedisCacheService } from "../services/redis-cache.service";
import { JwtPayload } from "../../../auth/interfaces/jwt.interface";
import { Request } from "express";

/**
 * Cache Interceptor
 * Automatically caches GET responses
 */
@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(private readonly cacheService: RedisCacheService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as JwtPayload;

    // Only cache GET requests
    if (request.method !== "GET") {
      return next.handle();
    }

    // Skip caching for non-authenticated requests
    if (!user?.tenant_id) {
      return next.handle();
    }

    // Build cache key
    const cacheKey = this.buildCacheKey(request, user.tenant_id);

    // Check for cache bypass header
    if (request.headers["cache-control"] === "no-cache") {
      return next.handle().pipe(
        tap((response) => {
          this.cacheService.set(cacheKey, response, this.getTTL(request));
        }),
      );
    }

    // Try to get from cache first
    return new Observable((subscriber) => {
      this.cacheService.get(cacheKey).then((cached) => {
        if (cached !== null) {
          subscriber.next(cached);
          subscriber.complete();
        } else {
          // Cache miss, execute handler and cache result
          next
            .handle()
            .pipe(
              tap((response) => {
                this.cacheService.set(
                  cacheKey,
                  response,
                  this.getTTL(request),
                  this.getTags(request, user.tenant_id),
                );
              }),
            )
            .subscribe(subscriber);
        }
      });
    });
  }

  /**
   * Build cache key from request
   */
  private buildCacheKey(request: Request, tenantId: string): string {
    const path = request.route?.path || request.path;
    const query =
      Object.keys(request.query).length > 0
        ? JSON.stringify(request.query)
        : "";
    const params =
      Object.keys(request.params).length > 0
        ? JSON.stringify(request.params)
        : "";

    return `api:${tenantId}:${path}:${params}:${query}`;
  }

  /**
   * Get TTL based on endpoint
   */
  private getTTL(request: Request): number {
    const path = request.route?.path || request.path;

    // Dashboard stats - short TTL
    if (path.includes("/dashboard")) {
      return 60; // 1 minute
    }

    // List endpoints - medium TTL
    if (path.includes("/list") || request.query.page) {
      return 300; // 5 minutes
    }

    // Default TTL
    return 3600; // 1 hour
  }

  /**
   * Get cache tags for invalidation
   */
  private getTags(request: Request, tenantId: string): string[] {
    const path = request.route?.path || request.path;
    const tags: string[] = [];

    // Add entity-based tags
    if (path.includes("/clients")) {
      tags.push(`clients:${tenantId}`);
    }
    if (path.includes("/cases")) {
      tags.push(`cases:${tenantId}`);
    }
    if (path.includes("/documents")) {
      tags.push(`documents:${tenantId}`);
    }
    if (path.includes("/events")) {
      tags.push(`events:${tenantId}`);
    }

    return tags;
  }
}
