/**
 * Stripe Payment Gateway Implementation
 *
 * Stripe is used for international customers (non-BR).
 * Uses Stripe Checkout for a redirect-based flow.
 *
 * Docs: https://docs.stripe.com/api
 */

import Stripe from "stripe";
import type {
  PaymentGateway,
  CreateCustomerInput,
  CreateCustomerResult,
  CreateSubscriptionInput,
  CreateSubscriptionResult,
  CancelSubscriptionResult,
  WebhookEvent,
  WebhookEventType,
} from "./types";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";

// Stripe price IDs (set in dashboard or via API)
const PLAN_PRICE_MAP: Record<string, string> = {
  premium: process.env.STRIPE_PRICE_PREMIUM || "",
  pro: process.env.STRIPE_PRICE_PRO || "",
};

export class StripeGateway implements PaymentGateway {
  readonly name = "stripe";

  async createCustomer(input: CreateCustomerInput): Promise<CreateCustomerResult> {
    const customer = await stripe.customers.create({
      email: input.email,
      name: input.name,
      phone: input.phone || undefined,
      metadata: {
        userId: input.userId,
      },
    });

    return {
      gatewayCustomerId: customer.id,
      gateway: this.name,
    };
  }

  async createSubscription(
    input: CreateSubscriptionInput
  ): Promise<CreateSubscriptionResult> {
    const priceId = PLAN_PRICE_MAP[input.planId];

    if (!priceId) {
      throw new Error(`No Stripe price ID for plan: ${input.planId}`);
    }

    // Use Stripe Checkout Session for a hosted payment page
    const session = await stripe.checkout.sessions.create({
      customer: input.gatewayCustomerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?checkout=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/plans?checkout=canceled`,
      metadata: {
        planId: input.planId,
      },
    });

    return {
      gatewaySubscriptionId: session.subscription as string || session.id,
      status: "pending", // Will become active after payment
      checkoutUrl: session.url || undefined,
    };
  }

  async cancelSubscription(
    gatewaySubscriptionId: string
  ): Promise<CancelSubscriptionResult> {
    const subscription = await stripe.subscriptions.update(
      gatewaySubscriptionId,
      { cancel_at_period_end: true }
    );

    return {
      success: true,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    };
  }

  async parseWebhook(
    headers: Record<string, string>,
    body: string
  ): Promise<WebhookEvent | null> {
    const signature =
      headers["stripe-signature"] || headers["Stripe-Signature"] || "";

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.error("[Stripe] Webhook signature verification failed:", err);
      return null;
    }

    const eventMap: Record<string, WebhookEventType> = {
      "customer.subscription.created": "subscription.created",
      "customer.subscription.updated": "subscription.updated",
      "customer.subscription.deleted": "subscription.canceled",
      "invoice.payment_succeeded": "payment.confirmed",
      "invoice.payment_failed": "payment.failed",
      "charge.refunded": "payment.refunded",
    };

    const mappedType = eventMap[event.type];
    if (!mappedType) return null;

    const data = event.data.object as unknown as Record<string, unknown>;

    // Extract subscription and customer IDs depending on event type
    let gatewaySubscriptionId: string | undefined;
    let gatewayCustomerId: string | undefined;
    let amount: number | undefined;

    if ("subscription" in data && typeof data.subscription === "string") {
      gatewaySubscriptionId = data.subscription;
    } else if ("id" in data && event.type.startsWith("customer.subscription")) {
      gatewaySubscriptionId = data.id as string;
    }

    if ("customer" in data && typeof data.customer === "string") {
      gatewayCustomerId = data.customer;
    }

    if ("amount_paid" in data && typeof data.amount_paid === "number") {
      amount = data.amount_paid / 100; // Stripe uses cents
    } else if ("amount" in data && typeof data.amount === "number") {
      amount = (data.amount as number) / 100;
    }

    return {
      type: mappedType,
      gatewayEventId: event.id,
      gatewaySubscriptionId,
      gatewayCustomerId,
      amount,
      currency: "USD",
      rawPayload: event,
    };
  }

  async getPlanPriceId(planSlug: string): Promise<string | null> {
    return PLAN_PRICE_MAP[planSlug] || null;
  }
}
