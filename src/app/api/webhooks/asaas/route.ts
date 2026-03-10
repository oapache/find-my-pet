import { NextRequest, NextResponse } from "next/server";
import { getGatewayByName, processWebhookEvent } from "@/lib/payments";

/**
 * POST /api/webhooks/asaas
 * Receives payment/subscription events from Asaas.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();

    // Convert headers to plain object
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });

    const gateway = getGatewayByName("asaas");
    const event = await gateway.parseWebhook(headers, body);

    if (!event) {
      // Event ignored or invalid signature
      return NextResponse.json({ received: true, processed: false });
    }

    await processWebhookEvent("asaas", event);

    return NextResponse.json({ received: true, processed: true });
  } catch (error) {
    console.error("[Webhook/Asaas] Error processing webhook:", error);
    // Return 200 to prevent retries for processing errors
    return NextResponse.json(
      { received: true, error: "Processing failed" },
      { status: 200 }
    );
  }
}
