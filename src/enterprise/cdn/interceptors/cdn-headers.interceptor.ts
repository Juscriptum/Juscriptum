import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { CdnService } from "../services/cdn.service";
import { JwtPayload } from "../../../auth/interfaces/jwt.interface";
import { Request, Response } from "express";

/**
 * CDN Headers Interceptor
 * Adds appropriate cache headers to responses
 */
@Injectable()
export class CdnHeadersInterceptor implements NestInterceptor {
  constructor(private readonly cdnService: CdnService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const user = request.user as JwtPayload;

    return next.handle().pipe(
      tap(() => {
        if (!this.cdnService.isEnabled()) {
          return;
        }

        const path = request.route?.path || request.path;
        const cacheHeaders = this.cdnService.getCacheHeaders(
          path,
          user?.tenant_id,
        );

        // Set cache headers
        for (const [key, value] of Object.entries(cacheHeaders)) {
          response.setHeader(key, value);
        }

        // Set surrogate keys for granular purging
        if (user?.tenant_id) {
          const keys = this.getSurrogateKeys(path, user.tenant_id);
          if (keys.length > 0) {
            response.setHeader("Surrogate-Key", keys.join(" "));
          }
        }

        // Add ETag for conditional requests
        response.setHeader("Vary", "Accept-Encoding, Authorization");
      }),
    );
  }

  /**
   * Get surrogate keys for path
   */
  private getSurrogateKeys(path: string, tenantId: string): string[] {
    const keys: string[] = [`tenant:${tenantId}`];

    if (path.includes("/clients")) {
      keys.push(`clients:${tenantId}`);
    }
    if (path.includes("/cases")) {
      keys.push(`cases:${tenantId}`);
    }
    if (path.includes("/documents")) {
      keys.push(`documents:${tenantId}`);
    }
    if (path.includes("/events")) {
      keys.push(`events:${tenantId}`);
    }

    return keys;
  }
}
