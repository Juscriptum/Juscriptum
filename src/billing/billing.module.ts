import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule } from "@nestjs/config";

// Entities
import { Subscription } from "../database/entities/Subscription.entity";
import { Organization } from "../database/entities/Organization.entity";

// Services
import { BillingService } from "./services/billing.service";
import { StripeService } from "./services/stripe.service";
import { WayForPayService } from "./services/wayforpay.service";
import { BILLING_SYNC_PORT } from "./services/billing.types";

// Controllers
import { BillingController } from "./controllers/billing.controller";
import { BillingWebhooksController } from "./controllers/billing-webhooks.controller";

// External modules
import { AuthModule } from "../auth/auth.module";

/**
 * Billing Module
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Subscription, Organization]),
    ConfigModule,
    forwardRef(() => AuthModule),
  ],
  controllers: [BillingController, BillingWebhooksController],
  providers: [
    BillingService,
    StripeService,
    WayForPayService,
    {
      provide: BILLING_SYNC_PORT,
      useExisting: BillingService,
    },
  ],
  exports: [BillingService, StripeService, WayForPayService],
})
export class BillingModule {}
