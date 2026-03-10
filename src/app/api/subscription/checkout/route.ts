import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { startCheckout, cancelSubscription, getUserPlan } from "@/lib/payments";

/**
 * POST /api/subscription/checkout
 * Start a subscription checkout flow.
 *
 * Body: { planSlug: string, billingType?: "BOLETO" | "CREDIT_CARD" | "PIX" }
 * Returns: { subscriptionId, checkoutUrl?, status }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { planSlug, billingType } = body;

    if (!planSlug) {
      return NextResponse.json(
        { error: "planSlug is required" },
        { status: 400 }
      );
    }

    const result = await startCheckout({
      userId: session.user.id,
      planSlug,
      billingType,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";

    const errorMap: Record<string, { msg: string; status: number }> = {
      PLAN_NOT_FOUND: { msg: "Plan not found", status: 404 },
      CANNOT_SUBSCRIBE_FREE: {
        msg: "Cannot subscribe to the free plan",
        status: 400,
      },
      ALREADY_SUBSCRIBED: {
        msg: "You already have an active subscription",
        status: 409,
      },
    };

    const mapped = errorMap[message];
    if (mapped) {
      return NextResponse.json({ error: mapped.msg }, { status: mapped.status });
    }

    console.error("[subscription/checkout] Error:", error);
    return NextResponse.json(
      { error: "Failed to start checkout" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/subscription/checkout
 * Get the current user's plan info.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await getUserPlan(session.user.id);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[subscription/checkout] Error:", error);
    return NextResponse.json(
      { error: "Failed to get plan info" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/subscription/checkout
 * Cancel the current subscription.
 */
export async function DELETE() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await cancelSubscription(session.user.id);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";

    if (message === "NO_ACTIVE_SUBSCRIPTION") {
      return NextResponse.json(
        { error: "No active subscription to cancel" },
        { status: 404 }
      );
    }

    console.error("[subscription/cancel] Error:", error);
    return NextResponse.json(
      { error: "Failed to cancel subscription" },
      { status: 500 }
    );
  }
}
