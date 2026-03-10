/**
 * Asaas Payment Gateway Implementation
 *
 * Asaas is a Brazilian payment gateway supporting:
 * - PIX (instant payment)
 * - Boleto (bank slip)
 * - Credit Card
 *
 * Rates: ~2.99% credit card, R$1.99/PIX, R$3.49/boleto
 *
 * Docs: https://docs.asaas.com
 */

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

const ASAAS_API_URL = process.env.ASAAS_API_URL || "https://api.asaas.com/v3";
const ASAAS_API_KEY = process.env.ASAAS_API_KEY || "";
const ASAAS_WEBHOOK_TOKEN = process.env.ASAAS_WEBHOOK_TOKEN || "";

// Asaas plan price mapping (configured in Asaas dashboard)
const PLAN_PRICE_MAP: Record<string, { value: number; cycle: string; description: string }> = {
  premium: { value: 14.90, cycle: "MONTHLY", description: "Find My Pet Premium" },
  pro: { value: 29.90, cycle: "MONTHLY", description: "Find My Pet Pro" },
};

async function asaasRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${ASAAS_API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      access_token: ASAAS_API_KEY,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`[Asaas] ${options.method || "GET"} ${endpoint} failed:`, error);
    throw new Error(`Asaas API error: ${response.status} - ${error}`);
  }

  return response.json() as T;
}

export class AsaasGateway implements PaymentGateway {
  readonly name = "asaas";

  async createCustomer(input: CreateCustomerInput): Promise<CreateCustomerResult> {
    const payload: Record<string, unknown> = {
      name: input.name,
      email: input.email,
      externalReference: input.userId,
    };

    // CPF/CNPJ is required for Asaas
    if (input.cpfCnpj) {
      payload.cpfCnpj = input.cpfCnpj.replace(/\D/g, "");
    }
    if (input.phone) {
      payload.phone = input.phone.replace(/\D/g, "");
    }

    const result = await asaasRequest<{ id: string }>("/customers", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    return {
      gatewayCustomerId: result.id,
      gateway: this.name,
    };
  }

  async createSubscription(
    input: CreateSubscriptionInput
  ): Promise<CreateSubscriptionResult> {
    const planSlug = input.planId;
    const planConfig = PLAN_PRICE_MAP[planSlug];

    if (!planConfig) {
      throw new Error(`No Asaas price config for plan: ${planSlug}`);
    }

    const payload: Record<string, unknown> = {
      customer: input.gatewayCustomerId,
      billingType: input.billingType || "UNDEFINED", // Let customer choose
      value: planConfig.value,
      cycle: planConfig.cycle,
      description: planConfig.description,
      nextDueDate: new Date(Date.now() + 86400000).toISOString().split("T")[0], // Tomorrow
    };

    // Add credit card info if provided
    if (input.billingType === "CREDIT_CARD" && input.creditCard) {
      payload.creditCard = {
        holderName: input.creditCard.holderName,
        number: input.creditCard.number,
        expiryMonth: input.creditCard.expiryMonth,
        expiryYear: input.creditCard.expiryYear,
        ccv: input.creditCard.ccv,
      };

      if (input.creditCardHolderInfo) {
        payload.creditCardHolderInfo = {
          name: input.creditCardHolderInfo.name,
          email: input.creditCardHolderInfo.email,
          cpfCnpj: input.creditCardHolderInfo.cpfCnpj.replace(/\D/g, ""),
          postalCode: input.creditCardHolderInfo.postalCode.replace(/\D/g, ""),
          addressNumber: input.creditCardHolderInfo.addressNumber,
          phone: input.creditCardHolderInfo.phone.replace(/\D/g, ""),
        };
      }
    }

    const result = await asaasRequest<{
      id: string;
      status: string;
      nextDueDate: string;
    }>("/subscriptions", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    // Build the payment link for redirect checkout
    const checkoutUrl = `https://www.asaas.com/c/${result.id}`;

    const now = new Date();
    return {
      gatewaySubscriptionId: result.id,
      status: this.mapSubscriptionStatus(result.status),
      currentPeriodStart: now,
      currentPeriodEnd: new Date(result.nextDueDate),
      checkoutUrl,
    };
  }

  async cancelSubscription(
    gatewaySubscriptionId: string
  ): Promise<CancelSubscriptionResult> {
    await asaasRequest(`/subscriptions/${gatewaySubscriptionId}`, {
      method: "DELETE",
    });

    return {
      success: true,
      cancelAtPeriodEnd: false, // Asaas cancels immediately
    };
  }

  async parseWebhook(
    headers: Record<string, string>,
    body: string
  ): Promise<WebhookEvent | null> {
    // Validate webhook token
    const token = headers["asaas-access-token"] || headers["access_token"];
    if (ASAAS_WEBHOOK_TOKEN && token !== ASAAS_WEBHOOK_TOKEN) {
      console.warn("[Asaas] Invalid webhook token");
      return null;
    }

    const payload = JSON.parse(body);
    const event = payload.event as string;

    const eventMap: Record<string, WebhookEventType> = {
      PAYMENT_CONFIRMED: "payment.confirmed",
      PAYMENT_RECEIVED: "payment.confirmed",
      PAYMENT_OVERDUE: "payment.overdue",
      PAYMENT_REFUNDED: "payment.refunded",
      PAYMENT_DELETED: "payment.failed",
      SUBSCRIPTION_CREATED: "subscription.created",
      SUBSCRIPTION_UPDATED: "subscription.updated",
      SUBSCRIPTION_DELETED: "subscription.canceled",
      SUBSCRIPTION_EXPIRED: "subscription.expired",
    };

    const mappedType = eventMap[event];
    if (!mappedType) {
      // Ignore unhandled event types
      return null;
    }

    return {
      type: mappedType,
      gatewayEventId: payload.payment?.id || payload.subscription?.id || event,
      gatewaySubscriptionId: payload.payment?.subscription || payload.subscription?.id,
      gatewayCustomerId: payload.payment?.customer || payload.subscription?.customer,
      amount: payload.payment?.value,
      currency: "BRL",
      rawPayload: payload,
    };
  }

  async getPlanPriceId(planSlug: string): Promise<string | null> {
    // Asaas doesn't use price IDs — we send the value directly
    return PLAN_PRICE_MAP[planSlug] ? planSlug : null;
  }

  private mapSubscriptionStatus(
    asaasStatus: string
  ): "active" | "pending" | "trialing" {
    switch (asaasStatus) {
      case "ACTIVE":
        return "active";
      default:
        return "pending";
    }
  }
}
