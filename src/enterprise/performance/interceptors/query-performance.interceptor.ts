import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { QueryOptimizationService } from "../services/query-optimization.service";
import { JwtPayload } from "../../../auth/interfaces/jwt.interface";
import { Request } from "express";

/**
 * Query Performance Interceptor
 * Monitors and logs slow database queries
 */
@Injectable()
export class QueryPerformanceInterceptor implements NestInterceptor {
  private readonly slowQueryThreshold: number;

  constructor(
    private readonly queryOptimizationService: QueryOptimizationService,
  ) {
    this.slowQueryThreshold = parseInt(
      process.env.SLOW_QUERY_THRESHOLD || "1000",
      10,
    );
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as JwtPayload;
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        complete: () => {
          const duration = Date.now() - startTime;

          if (duration > this.slowQueryThreshold) {
            this.logSlowRequest(request, duration, user);
          }
        },
      }),
    );
  }

  /**
   * Log slow request for analysis
   */
  private logSlowRequest(
    request: Request,
    duration: number,
    user?: JwtPayload,
  ): void {
    const requestInfo = {
      method: request.method,
      path: request.route?.path || request.path,
      query: request.query,
      params: request.params,
      userAgent: request.headers["user-agent"],
    };

    console.warn({
      type: "slow_request",
      duration,
      tenantId: user?.tenant_id,
      userId: user?.user_id,
      request: requestInfo,
      timestamp: new Date().toISOString(),
    });
  }
}
