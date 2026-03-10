/**
 * Payment Gateway Abstraction Layer
 *
 * Defines the interface that all payment gateways must implement.
 * Currently supports: Asaas (BR) and Stripe (International).
 */

export interface CreateCustomerInput {
  email: string;
  name: string;
  cpfCnpj?: string; // Required for Asaas
  phone?: string;
  userId: string;
}

export interface CreateCustomerResult {
  gatewayCustomerId: string;
  gateway: string;
}

export interface CreateSubscriptionInput {
  gatewayCustomerId: string;
  planId: string; // Internal plan ID
  billingType?: "BOLETO" | "CREDIT_CARD" | "PIX" | "UNDEFINED"; // Asaas-specific
  creditCard?: CreditCardInput;
  creditCardHolderInfo?: CreditCardHolderInput;
}

export interface CreditCardInput {
  holderName: string;
  number: string;
  expiryMonth: string;
  expiryYear: string;
  ccv: string;
}

export interface CreditCardHolderInput {
  name: string;
  email: string;
  cpfCnpj: string;
  postalCode: string;
  addressNumber: string;
  phone: string;
}

export interface CreateSubscriptionResult {
  gatewaySubscriptionId: string;
  status: "active" | "pending" | "trialing";
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  checkoutUrl?: string; // For redirect-based checkout (Stripe Checkout, Asaas billing link)
}

export interface CancelSubscriptionResult {
  success: boolean;
  cancelAtPeriodEnd: boolean;
}

export interface WebhookEvent {
  type: WebhookEventType;
  gatewayEventId: string;
  gatewaySubscriptionId?: string;
  gatewayCustomerId?: string;
  amount?: number;
  currency?: string;
  rawPayload: unknown;
}

export type WebhookEventType =
  | "subscription.created"
  | "subscription.updated"
  | "subscription.canceled"
  | "subscription.expired"
  | "payment.confirmed"
  | "payment.failed"
  | "payment.refunded"
  | "payment.overdue";

export interface PaymentGateway {
  readonly name: string;

  /**
   * Create a customer in the payment gateway.
   */
  createCustomer(input: CreateCustomerInput): Promise<CreateCustomerResult>;

  /**
   * Create a subscription for a customer.
   * May return a checkout URL for redirect-based flows.
   */
  createSubscription(input: CreateSubscriptionInput): Promise<CreateSubscriptionResult>;

  /**
   * Cancel a subscription (at period end by default).
   */
  cancelSubscription(gatewaySubscriptionId: string): Promise<CancelSubscriptionResult>;

  /**
   * Parse and validate a webhook event from the gateway.
   * Returns null if the event should be ignored.
   */
  parseWebhook(headers: Record<string, string>, body: string): Promise<WebhookEvent | null>;

  /**
   * Get the plan's price ID in this gateway's system.
   */
  getPlanPriceId(planSlug: string): Promise<string | null>;
}
