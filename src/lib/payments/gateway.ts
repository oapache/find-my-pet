/**
 * Payment Gateway Factory
 *
 * Selects the appropriate payment gateway based on the user's country.
 * - BR users → Asaas (PIX, Boleto, Credit Card)
 * - International users → Stripe (Card)
 */

import type { PaymentGateway } from "./types";
import { AsaasGateway } from "./asaas";
import { StripeGateway } from "./stripe";

// Singleton instances
let asaasInstance: AsaasGateway | null = null;
let stripeInstance: StripeGateway | null = null;

export function getGateway(country: string = "BR"): PaymentGateway {
  if (country === "BR") {
    if (!asaasInstance) asaasInstance = new AsaasGateway();
    return asaasInstance;
  }

  if (!stripeInstance) stripeInstance = new StripeGateway();
  return stripeInstance;
}

export function getGatewayByName(name: string): PaymentGateway {
  switch (name) {
    case "asaas":
      if (!asaasInstance) asaasInstance = new AsaasGateway();
      return asaasInstance;
    case "stripe":
      if (!stripeInstance) stripeInstance = new StripeGateway();
      return stripeInstance;
    default:
      throw new Error(`Unknown payment gateway: ${name}`);
  }
}
