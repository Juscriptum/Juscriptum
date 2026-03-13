import { SetMetadata } from "@nestjs/common";
import {
  SubscriptionPlan,
  UserRole,
} from "../../database/entities/enums/subscription.enum";

export const ROLES_KEY = "roles";
export const REQUIRED_PLAN_KEY = "requiredPlan";

export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

export const RequirePlan = (plan: SubscriptionPlan) =>
  SetMetadata(REQUIRED_PLAN_KEY, plan);
