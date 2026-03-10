import { NextRequest, NextResponse } from "next/server";
import { getGatewayByName, processWebhookEvent } from "@/lib/payments";

/**
 * POST /api/webhooks/stripe
 * Receives payment/subscription events from Stripe.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();

    // Convert headers to plain object
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });

    const gateway = getGatewayByName("stripe");
    const event = await gateway.parseWebhook(headers, body);

    if (!event) {
      return NextResponse.json({ received: true, processed: false });
    }

    await processWebhookEvent("stripe", event);

    return NextResponse.json({ received: true, processed: true });
  } catch (error) {
    console.error("[Webhook/Stripe] Error processing webhook:", error);
    return NextResponse.json(
      { received: true, error: "Processing failed" },
      { status: 200 }
    );
  }
}
