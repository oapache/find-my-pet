"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";

interface Plan {
  slug: string;
  name: string;
  price: string;
  description: string;
  features: string[];
  popular: boolean;
}

interface PlansGridProps {
  plans: Plan[];
  currentPlanSlug: string;
  isLoggedIn: boolean;
  locale: string;
}

export function PlansGrid({
  plans,
  currentPlanSlug,
  isLoggedIn,
  locale,
}: PlansGridProps) {
  const t = useTranslations("Plans");
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [showBillingType, setShowBillingType] = useState<string | null>(null);

  const handleChoosePlan = async (
    planSlug: string,
    billingType?: string
  ) => {
    if (!isLoggedIn) {
      router.push("/auth/signin");
      return;
    }

    if (planSlug === "free" || planSlug === currentPlanSlug) return;

    // For Brazilian users, show billing type selector
    if (locale === "pt-BR" && !billingType) {
      setShowBillingType(planSlug);
      return;
    }

    setLoading(planSlug);
    try {
      const response = await fetch("/api/subscription/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planSlug,
          billingType: billingType || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Checkout failed");
        return;
      }

      // Redirect to checkout URL if available
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        // Subscription created directly
        router.push("/dashboard");
      }
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setLoading(null);
      setShowBillingType(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 pb-16">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan) => {
          const isCurrent = plan.slug === currentPlanSlug;
          const isPopular = plan.popular;

          return (
            <div
              key={plan.slug}
              className={`relative bg-[var(--color-bg)] rounded-2xl shadow-lg overflow-hidden transition-transform hover:scale-[1.02] ${
                isPopular
                  ? "ring-2 ring-[var(--color-primary)] shadow-xl"
                  : "border border-[var(--color-border)]"
              }`}
            >
              {/* Popular badge */}
              {isPopular && (
                <div className="bg-[var(--color-primary)] text-white text-sm font-semibold text-center py-2">
                  ⭐ {t("popular")}
                </div>
              )}

              <div className="p-8">
                {/* Plan header */}
                <h3 className="text-xl font-bold text-[var(--color-text)] mb-2">
                  {plan.name}
                </h3>
                <p className="text-sm text-[var(--color-text-secondary)] mb-6">
                  {plan.description}
                </p>

                {/* Price */}
                <div className="mb-8">
                  <span className="text-4xl font-bold text-[var(--color-text)]">
                    {plan.price}
                  </span>
                  {plan.slug !== "free" && (
                    <span className="text-[var(--color-text-secondary)]">
                      {t("perMonth")}
                    </span>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 text-sm text-[var(--color-text)]"
                    >
                      <span className="text-green-500 mt-0.5 flex-shrink-0">
                        ✓
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* Billing type selector (BR only) */}
                {showBillingType === plan.slug && (
                  <div className="mb-4 p-4 bg-[var(--color-bg-secondary)] rounded-lg space-y-2">
                    <p className="text-sm font-medium text-[var(--color-text)] mb-3">
                      {t("billingType")}
                    </p>
                    <button
                      onClick={() => handleChoosePlan(plan.slug, "PIX")}
                      className="w-full py-2 px-4 text-sm rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-bg)] transition-colors text-left"
                    >
                      💸 {t("pix")}
                    </button>
                    <button
                      onClick={() =>
                        handleChoosePlan(plan.slug, "CREDIT_CARD")
                      }
                      className="w-full py-2 px-4 text-sm rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-bg)] transition-colors text-left"
                    >
                      💳 {t("creditCard")}
                    </button>
                    <button
                      onClick={() => handleChoosePlan(plan.slug, "BOLETO")}
                      className="w-full py-2 px-4 text-sm rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-bg)] transition-colors text-left"
                    >
                      🏦 {t("boleto")}
                    </button>
                  </div>
                )}

                {/* CTA Button */}
                <button
                  onClick={() => handleChoosePlan(plan.slug)}
                  disabled={isCurrent || loading === plan.slug}
                  className={`w-full py-3 px-6 rounded-lg font-semibold text-sm transition-colors ${
                    isCurrent
                      ? "bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] cursor-default"
                      : isPopular
                        ? "bg-[var(--color-primary)] text-white hover:opacity-90"
                        : plan.slug === "free"
                          ? "bg-[var(--color-bg-secondary)] text-[var(--color-text)] cursor-default"
                          : "bg-[var(--color-text)] text-[var(--color-bg)] hover:opacity-90"
                  }`}
                >
                  {loading === plan.slug
                    ? t("processing")
                    : isCurrent
                      ? t("currentPlan")
                      : plan.slug === "free"
                        ? t("currentPlan")
                        : t("choosePlan")}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
