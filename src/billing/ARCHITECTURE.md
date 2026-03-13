/**
 * Billing Module Architecture
 * =========================
 *
 * Providers:
 * 1. Stripe - For international payments (USD, EUR)
 * 2. WayForPay - For Ukrainian payments (UAH)
 *
 * Flow:
 * 1. User selects plan
 * 2. Backend creates checkout session/customer
 * 3. Frontend redirects to payment page
 * 4. Provider sends webhook to backend
 * 5. Backend updates subscription status
 * 6. Frontend polls for status update
 *
 * Webhook Security:
 * - Stripe: Verify signature using webhook secret
 * - WayForPay: Verify HMAC signature
 *
 * Subscription States:
 * trialing -> active -> past_due -> canceled
 * trialing -> active -> unpaid -> canceled
 *
 * Plan Changes:
 * - Upgrade: Pro-rate immediately
 * - Downgrade: Apply at period end
 * - Cancel: Access until period end
 */
