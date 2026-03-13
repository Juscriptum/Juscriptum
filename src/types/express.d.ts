import "express";

declare module "express" {
  interface Request {
    user?: {
      user_id: string;
      tenant_id: string;
      role: string;
      subscription_plan: string;
      email: string;
      jti?: string;
      iat?: number;
      exp?: number;
    };
    subscriptionPlan?: string;
    correlationId?: string;
    userDetails?: any;
  }
}
