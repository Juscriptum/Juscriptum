import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthGuard } from "@nestjs/passport";
import { JwtPayload } from "../../auth/interfaces/jwt.interface";
import {
  ROLES_KEY,
  REQUIRED_PLAN_KEY,
} from "../decorators/access-control.decorators";
import { getPlanLevel } from "../../common/security/subscription-limits";

/**
 * JWT Auth Guard
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {}

/**
 * Tenant Guard - Ensures requests include valid tenant_id
 */
@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private _reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user: JwtPayload = request.user;

    if (!user || !user.tenant_id) {
      throw new UnauthorizedException("Tenant ID missing in JWT");
    }

    // Set tenant_id in request for downstream use
    request.tenantId = user.tenant_id;

    return true;
  }
}

/**
 * RBAC Guard - Role-Based Access Control
 */
@Injectable()
export class RbacGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: JwtPayload = request.user;

    if (!user || !user.role) {
      throw new UnauthorizedException("Role missing in JWT");
    }

    const hasRole = requiredRoles.includes(user.role);

    if (!hasRole) {
      throw new ForbiddenException(
        `Доступ заборонено. Необхідно: ${requiredRoles.join(", ")}, наявно: ${user.role}`,
      );
    }

    return true;
  }
}

/**
 * Subscription Guard - Feature gating based on plan
 */
@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPlan = this.reflector.getAllAndOverride<string>(
      REQUIRED_PLAN_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPlan) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: JwtPayload = request.user;

    if (!user || !user.subscription_plan) {
      throw new UnauthorizedException("Subscription plan missing in JWT");
    }

    const userLevel = getPlanLevel(user.subscription_plan);
    const requiredLevel = getPlanLevel(requiredPlan);

    if (userLevel < requiredLevel) {
      throw new ForbiddenException(
        `Ця функція доступна на тарифі ${requiredPlan}`,
      );
    }

    return true;
  }
}

/**
 * Owner Guard - Only organization owner can access
 */
@Injectable()
export class OwnerGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user: JwtPayload = request.user;

    if (!user || user.role !== "organization_owner") {
      throw new ForbiddenException(
        "Тільки власник організації може виконувати цю дію",
      );
    }

    return true;
  }
}

/**
 * Email Verified Guard - Require verified email
 */
@Injectable()
export class EmailVerifiedGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user: JwtPayload = request.user;

    if (!user) {
      throw new UnauthorizedException("Unauthorized");
    }

    // Email verified status should be in JWT or fetched from DB
    const emailVerified = request.userDetails?.emailVerified ?? false;

    if (!emailVerified) {
      throw new ForbiddenException(
        "Будь ласка, підтвердіть свою електронну пошту",
      );
    }

    return true;
  }
}

/**
 * MFA Enabled Guard - Require MFA for sensitive operations
 */
@Injectable()
export class MfaGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requireMfa = this.reflector.getAllAndOverride<boolean>("requireMfa", [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requireMfa) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: JwtPayload = request.user;
    const mfaEnabled = request.userDetails?.mfaEnabled ?? false;

    if (!mfaEnabled) {
      throw new ForbiddenException(
        "Ця дія вимагає увімкненої двофакторної аутентифікації",
      );
    }

    return true;
  }
}

/**
 * Super Admin Guard - Only super admins
 */
@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user: JwtPayload = request.user;

    if (user.role !== "super_admin") {
      throw new ForbiddenException(
        "Тільки супер адміністратор має доступ до цього ресурсу",
      );
    }

    return true;
  }
}

/**
 * Account Active Guard - Ensure account is not suspended/deleted
 */
@Injectable()
export class AccountActiveGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const userDetails = request.userDetails;

    if (!userDetails) {
      throw new UnauthorizedException("User details missing");
    }

    const status = userDetails.status;

    if (status === "suspended") {
      throw new ForbiddenException(
        "Ваш акаунт призупинено. Зв'яжіться з підтримкою.",
      );
    }

    if (status === "deleted") {
      throw new ForbiddenException("Ваш акаунт видалено.");
    }

    return true;
  }
}

/**
 * Combined Guard - All guards must pass
 */
@Injectable()
export class CombinedGuard implements CanActivate {
  constructor(
    private tenantGuard: TenantGuard,
    private rbacGuard: RbacGuard,
    private subscriptionGuard: SubscriptionGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const guards = [this.tenantGuard, this.rbacGuard, this.subscriptionGuard];

    for (const guard of guards) {
      const result = await guard.canActivate(context);
      if (!result) {
        return false;
      }
    }

    return true;
  }
}
