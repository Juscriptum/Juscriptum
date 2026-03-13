import {
  Controller,
  Post,
  Body,
  Req,
  HttpCode,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { StripeService } from "../services/stripe.service";
import { WayForPayService } from "../services/wayforpay.service";
import type { Request } from "express";

/**
 * Billing Webhooks Controller
 */
@ApiTags("Billing Webhooks")
@Controller("billing/webhooks")
export class BillingWebhooksController {
  private readonly logger = new Logger(BillingWebhooksController.name);

  constructor(
    private readonly stripeService: StripeService,
    private readonly wayForPayService: WayForPayService,
  ) {}

  @Post("stripe")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Stripe webhook" })
  @ApiResponse({ status: 200, description: "Webhook processed" })
  async handleStripeWebhook(
    @Body() body: any,
    @Req() req: Request,
  ): Promise<void> {
    const headers = req.headers as unknown as Record<
      string,
      string | undefined
    >;
    const signature = headers["stripe-signature"];
    if (!signature) {
      throw new Error("Missing stripe-signature header");
    }
    const payload =
      (req as any).rawBody instanceof Buffer
        ? (req as any).rawBody.toString("utf8")
        : JSON.stringify(body);

    await this.stripeService.handleWebhook(payload, signature);
  }

  @Post("wayforpay")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "WayForPay webhook callback" })
  @ApiResponse({ status: 200, description: "Webhook processed" })
  async handleWayForPayWebhook(
    @Body() payload: any,
  ): Promise<{ status: string }> {
    this.logger.log(
      `Received WayForPay webhook for order: ${payload.orderReference}`,
    );

    const result = await this.wayForPayService.handleWebhook(payload);

    // Return response in WayForPay expected format
    return {
      status: result.status,
    };
  }

  @Post("wayforpay/service")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "WayForPay service callback (alternative endpoint)",
  })
  @ApiResponse({ status: 200, description: "Service callback processed" })
  async handleWayForPayServiceCallback(@Body() payload: any): Promise<{
    orderReference: string;
    status: string;
    time: number;
    signature?: string;
  }> {
    this.logger.log(
      `Received WayForPay service callback for order: ${payload.orderReference}`,
    );

    try {
      const result = await this.wayForPayService.handleWebhook(payload);

      // Generate response signature
      const signature = this.wayForPayService.generateCallbackResponse(
        payload.orderReference,
        result.status === "ok" ? "accept" : "decline",
      );

      return {
        orderReference: payload.orderReference,
        status: result.status === "ok" ? "accept" : "decline",
        time: Math.floor(Date.now() / 1000),
        signature,
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to process WayForPay service callback: ${errorMessage}`,
      );

      return {
        orderReference: payload.orderReference,
        status: "decline",
        time: Math.floor(Date.now() / 1000),
      };
    }
  }
}
