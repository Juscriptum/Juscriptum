import { IsEnum, IsString, IsOptional, IsBoolean } from "class-validator";
import {
  SubscriptionPlan,
  SubscriptionProvider,
} from "../../database/entities/enums/subscription.enum";

/**
 * Create Checkout Session DTO
 */
export class CreateCheckoutSessionDto {
  @IsEnum(SubscriptionPlan)
  plan: SubscriptionPlan;

  @IsEnum(SubscriptionProvider)
  provider: SubscriptionProvider;

  @IsString()
  @IsOptional()
  successUrl?: string;

  @IsString()
  @IsOptional()
  cancelUrl?: string;

  @IsBoolean()
  @IsOptional()
  trial?: boolean;
}

/**
 * Checkout Session Response DTO
 */
export class CheckoutSessionResponseDto {
  checkoutUrl: string;
  sessionId: string;
}

/**
 * Cancel Subscription DTO
 */
export class CancelSubscriptionDto {
  @IsBoolean()
  @IsOptional()
  atPeriodEnd?: boolean;
}

/**
 * Resume Subscription DTO
 */
export class ResumeSubscriptionDto {
  @IsString()
  @IsOptional()
  plan?: SubscriptionPlan;
}

/**
 * Webhook DTO (shared)
 */
export class WebhookDto {
  @IsString()
  signature: string;

  @IsString()
  payload: string;
}

/**
 * Payment Method DTO
 */
export class PaymentMethodDto {
  @IsString()
  type: "card" | "bank_account";

  @IsString()
  token?: string;

  @IsString()
  @IsOptional()
  last4?: string;

  @IsString()
  @IsOptional()
  expMonth?: string;

  @IsString()
  @IsOptional()
  expYear?: string;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}
