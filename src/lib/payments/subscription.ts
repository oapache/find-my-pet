/**
 * Subscription Service
 *
 * Handles the business logic for plan subscriptions:
 * - Creating subscriptions via the appropriate gateway
 * - Processing webhook events
 * - Managing subscription lifecycle
 */

import { db } from "@/lib/db";
import { getGateway, getGatewayByName } from "./gateway";
import type { WebhookEvent, CreateSubscriptionInput } from "./types";

export interface CheckoutInput {
  userId: string;
  planSlug: string;
  billingType?: "BOLETO" | "CREDIT_CARD" | "PIX" | "UNDEFINED";
}

export interface CheckoutResult {
  subscriptionId: string;
  checkoutUrl?: string;
  status: string;
}

/**
 * Start a subscription checkout flow.
 *
 * 1. Finds/creates the gateway customer
 * 2. Creates a subscription in the gateway
 * 3. Saves the subscription record in the DB
 * 4. Returns checkout URL if redirect-based
 */
export async function startCheckout(input: CheckoutInput): Promise<CheckoutResult> {
  const { userId, planSlug, billingType } = input;

  // 1. Load user and plan
  const [user, plan] = await Promise.all([
    db.user.findUniqueOrThrow({ where: { id: userId } }),
    db.plan.findFirst({ where: { slug: planSlug, isActive: true } }),
  ]);

  if (!plan) {
    throw new Error("PLAN_NOT_FOUND");
  }

  if (planSlug === "free") {
    throw new Error("CANNOT_SUBSCRIBE_FREE");
  }

  // 2. Check for existing active subscription
  const existingSub = await db.subscription.findFirst({
    where: { userId, status: "active" },
  });

  if (existingSub) {
    throw new Error("ALREADY_SUBSCRIBED");
  }

  // 3. Get the appropriate gateway
  const gateway = getGateway(user.country);

  // 4. Get or create gateway customer
  let gatewayCustomerId: string | undefined;

  // Check if user already has a customer ID for this gateway
  const previousSub = await db.subscription.findFirst({
    where: { userId, gateway: gateway.name },
    select: { gatewayCustomerId: true },
    orderBy: { createdAt: "desc" },
  });

  if (previousSub?.gatewayCustomerId) {
    gatewayCustomerId = previousSub.gatewayCustomerId;
  } else {
    const customer = await gateway.createCustomer({
      email: user.email,
      name: user.name,
      phone: user.phone || undefined,
      userId: user.id,
    });
    gatewayCustomerId = customer.gatewayCustomerId;
  }

  // 5. Create subscription in gateway
  const subscriptionInput: CreateSubscriptionInput = {
    gatewayCustomerId,
    planId: planSlug,
    billingType,
  };

  const gatewayResult = await gateway.createSubscription(subscriptionInput);

  // 6. Save subscription to DB
  const subscription = await db.subscription.create({
    data: {
      userId,
      planId: plan.id,
      gateway: gateway.name,
      gatewaySubscriptionId: gatewayResult.gatewaySubscriptionId,
      gatewayCustomerId,
      status: gatewayResult.status,
      currentPeriodStart: gatewayResult.currentPeriodStart,
      currentPeriodEnd: gatewayResult.currentPeriodEnd,
    },
  });

  return {
    subscriptionId: subscription.id,
    checkoutUrl: gatewayResult.checkoutUrl,
    status: subscription.status,
  };
}

/**
 * Process a webhook event from a payment gateway.
 *
 * Updates subscription status and logs payment events.
 */
export async function processWebhookEvent(
  gatewayName: string,
  event: WebhookEvent
): Promise<void> {
  if (!event.gatewaySubscriptionId) {
    console.log("[Subscription] Webhook event has no subscription ID, skipping");
    return;
  }

  // Find the subscription
  const subscription = await db.subscription.findFirst({
    where: {
      gateway: gatewayName,
      gatewaySubscriptionId: event.gatewaySubscriptionId,
    },
    include: { plan: true },
  });

  if (!subscription) {
    console.warn(
      `[Subscription] No subscription found for gateway=${gatewayName} id=${event.gatewaySubscriptionId}`
    );
    return;
  }

  // Log the payment event (idempotent via gatewayEventId unique constraint)
  try {
    await db.paymentEvent.create({
      data: {
        subscriptionId: subscription.id,
        gateway: gatewayName,
        eventType: event.type,
        gatewayEventId: event.gatewayEventId,
        amount: event.amount ? event.amount : undefined,
        currency: event.currency,
        rawPayload: event.rawPayload as object,
      },
    });
  } catch (error: unknown) {
    // Duplicate event — already processed
    if (
      error instanceof Error &&
      error.message.includes("Unique constraint failed")
    ) {
      console.log(`[Subscription] Duplicate event: ${event.gatewayEventId}`);
      return;
    }
    throw error;
  }

  // Update subscription status based on event type
  switch (event.type) {
    case "payment.confirmed": {
      await db.subscription.update({
        where: { id: subscription.id },
        data: { status: "active" },
      });
      break;
    }

    case "payment.failed":
    case "payment.overdue": {
      await db.subscription.update({
        where: { id: subscription.id },
        data: { status: "past_due" },
      });
      break;
    }

    case "subscription.canceled":
    case "subscription.expired": {
      await db.subscription.update({
        where: { id: subscription.id },
        data: { status: "canceled" },
      });
      break;
    }

    case "payment.refunded": {
      await db.subscription.update({
        where: { id: subscription.id },
        data: { status: "canceled" },
      });
      break;
    }

    default:
      break;
  }
}

/**
 * Cancel a user's active subscription.
 */
export async function cancelSubscription(userId: string): Promise<void> {
  const subscription = await db.subscription.findFirst({
    where: { userId, status: "active" },
  });

  if (!subscription) {
    throw new Error("NO_ACTIVE_SUBSCRIPTION");
  }

  const gateway = getGatewayByName(subscription.gateway);

  if (subscription.gatewaySubscriptionId) {
    await gateway.cancelSubscription(subscription.gatewaySubscriptionId);
  }

  await db.subscription.update({
    where: { id: subscription.id },
    data: {
      status: "canceled",
      cancelAtPeriodEnd: true,
    },
  });
}

/**
 * Get the user's current active plan slug.
 */
export async function getUserPlan(
  userId: string
): Promise<{ planSlug: string; subscription: unknown | null }> {
  const subscription = await db.subscription.findFirst({
    where: { userId, status: "active" },
    include: { plan: true },
    orderBy: { createdAt: "desc" },
  });

  return {
    planSlug: subscription?.plan?.slug ?? "free",
    subscription: subscription ?? null,
  };
}
