import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
  OnModuleInit,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { DataSource } from "typeorm";
import { AsyncLocalStorage } from "node:async_hooks";
import { JwtPayload } from "../../auth/interfaces/jwt.interface";

export interface RlsRequestContext {
  tenantId: string;
  userId: string;
  role: string;
}

@Injectable()
export class RlsContextStore {
  private readonly storage = new AsyncLocalStorage<RlsRequestContext | null>();

  run<T>(context: RlsRequestContext | null, callback: () => T): T {
    return this.storage.run(context, callback);
  }

  get(): RlsRequestContext | null {
    return this.storage.getStore() ?? null;
  }
}

/**
 * RLS Interceptor - propagates authenticated request context so the
 * PostgreSQL query runner patch can attach per-request session variables.
 *
 * The previous implementation created a separate QueryRunner that was not
 * reused by TypeORM repositories, so it never affected the real queries.
 */
@Injectable()
export class RlsInterceptor implements NestInterceptor {
  constructor(private readonly contextStore: RlsContextStore) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as JwtPayload | undefined;

    if (!user?.tenant_id || !user.user_id || !user.role) {
      return next.handle();
    }

    return new Observable((subscriber) => {
      let subscription: { unsubscribe(): void } | undefined;

      this.contextStore.run(
        {
          tenantId: user.tenant_id,
          userId: user.user_id,
          role: user.role,
        },
        () => {
          subscription = next.handle().subscribe({
            next: (value) => subscriber.next(value),
            error: (error) => subscriber.error(error),
            complete: () => subscriber.complete(),
          });
        },
      );

      return () => subscription?.unsubscribe();
    });
  }
}

/**
 * Patches TypeORM Postgres QueryRunners so every acquired connection receives
 * the current request's tenant/user/role session variables before executing SQL.
 */
@Injectable()
export class RlsQueryRunnerPatcher implements OnModuleInit {
  private readonly logger = new Logger(RlsQueryRunnerPatcher.name);
  private patched = false;

  constructor(
    private readonly dataSource: DataSource,
    private readonly contextStore: RlsContextStore,
  ) {}

  onModuleInit(): void {
    if (this.patched || this.dataSource.options.type !== "postgres") {
      return;
    }

    const originalCreateQueryRunner = this.dataSource.createQueryRunner.bind(
      this.dataSource,
    );

    this.dataSource.createQueryRunner = (...args) => {
      const queryRunner = originalCreateQueryRunner(...args);
      const patchedQueryRunner = queryRunner as any;
      const originalQuery = queryRunner.query.bind(queryRunner) as (
        query: string,
        parameters?: any[],
        useStructuredResult?: boolean,
      ) => Promise<unknown>;
      const originalRelease = queryRunner.release.bind(queryRunner);

      let lastAppliedContextKey: string | null = null;
      let applyingContext = false;

      patchedQueryRunner.query = async (
        query: string,
        parameters?: any[],
        useStructuredResult?: boolean,
      ) => {
        if (!applyingContext && !this.isSessionContextQuery(query)) {
          const context = this.contextStore.get();
          const nextContextKey = this.getContextKey(context);

          if (lastAppliedContextKey !== nextContextKey) {
            applyingContext = true;

            try {
              if (context) {
                await originalQuery(
                  `
                    SELECT
                      set_config('app.current_tenant_id', $1, false),
                      set_config('app.current_user_id', $2, false),
                      set_config('app.current_user_role', $3, false)
                  `,
                  [context.tenantId, context.userId, context.role],
                );
              } else {
                await originalQuery(
                  `
                    SELECT
                      set_config('app.current_tenant_id', '', false),
                      set_config('app.current_user_id', '', false),
                      set_config('app.current_user_role', '', false)
                  `,
                );
              }

              lastAppliedContextKey = nextContextKey;
            } finally {
              applyingContext = false;
            }
          }
        }

        return originalQuery(query, parameters, useStructuredResult);
      };

      patchedQueryRunner.release = async () => {
        lastAppliedContextKey = null;
        return originalRelease();
      };

      return queryRunner;
    };

    this.patched = true;
    this.logger.log("Patched Postgres query runners for request-scoped RLS");
  }

  private getContextKey(context: RlsRequestContext | null): string {
    if (!context) {
      return "__anonymous__";
    }

    return `${context.tenantId}:${context.userId}:${context.role}`;
  }

  private isSessionContextQuery(query: string): boolean {
    const normalized = query.toLowerCase();
    return normalized.includes("set_config('app.current_");
  }
}
