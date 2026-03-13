import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { WormAuditService } from "../services/worm-audit.service";
import { JwtPayload } from "../../../auth/interfaces/jwt.interface";

/**
 * Audit Interceptor
 * Automatically logs audit events for controller actions
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: WormAuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as JwtPayload;

    if (!user?.tenant_id) {
      return next.handle();
    }

    const handler = context.getHandler();
    const className = context.getClass().name;
    const method = request.method;
    const path = request.route?.path || request.path;

    return next.handle().pipe(
      tap({
        next: () => {
          // Log successful operation
          this.logOperation(request, user, className, method, path, "success");
        },
        error: (error) => {
          // Log failed operation
          this.logOperation(
            request,
            user,
            className,
            method,
            path,
            "failure",
            error.message,
          );
        },
      }),
    );
  }

  private async logOperation(
    request: any,
    user: JwtPayload,
    className: string,
    method: string,
    path: string,
    status: "success" | "failure",
    errorMessage?: string,
  ) {
    try {
      const action = this.mapMethodToAction(method);
      const entityType = this.mapClassToEntity(className);

      await this.auditService.log({
        tenantId: user.tenant_id,
        userId: user.user_id,
        action,
        entityType,
        entityId: request.params?.id,
        newValues:
          method === "POST" || method === "PUT" || method === "PATCH"
            ? this.sanitizeBody(request.body)
            : undefined,
        ipAddress: request.ip,
        userAgent: request.headers["user-agent"],
        requestId: request.correlationId,
        metadata: {
          method,
          path,
          status,
          errorMessage,
        },
      });
    } catch (error) {
      // Don't fail the request if audit logging fails
      console.error("Audit logging failed:", error);
    }
  }

  private mapMethodToAction(method: string): any {
    const mapping: Record<string, string> = {
      POST: "create",
      PUT: "update",
      PATCH: "update",
      DELETE: "delete",
      GET: "export",
    };
    return mapping[method] || "update";
  }

  private mapClassToEntity(className: string): string {
    // Map controller names to entity types
    const mapping: Record<string, string> = {
      ClientsController: "client",
      CasesController: "case",
      DocumentsController: "document",
      EventsController: "event",
      InvoicesController: "invoice",
      OrganizationController: "organization",
      AuthController: "auth",
      BillingController: "subscription",
    };
    return (
      mapping[className] || className.replace("Controller", "").toLowerCase()
    );
  }

  private sanitizeBody(body: any): Record<string, any> {
    if (!body) return {};

    const sanitized = { ...body };
    const sensitiveFields = [
      "password",
      "passwordConfirm",
      "currentPassword",
      "token",
      "secret",
    ];

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = "[REDACTED]";
      }
    }

    return sanitized;
  }
}
