import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { PlansGrid } from "./plans-grid";

export default async function PlansPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();
  const t = await getTranslations({ locale, namespace: "Plans" });

  // Get user's current subscription
  let currentPlanSlug = "free";
  if (session?.user?.id) {
    const subscription = await db.subscription.findFirst({
      where: { userId: session.user.id, status: "active" },
      include: { plan: true },
    });
    currentPlanSlug = subscription?.plan?.slug ?? "free";
  }

  const plans = [
    {
      slug: "free",
      name: t("free.name"),
      price: t("free.price"),
      description: t("free.description"),
      features: t.raw("free.features") as string[],
      popular: false,
    },
    {
      slug: "premium",
      name: t("premium.name"),
      price: t("premium.price"),
      description: t("premium.description"),
      features: t.raw("premium.features") as string[],
      popular: true,
    },
    {
      slug: "pro",
      name: t("pro.name"),
      price: t("pro.price"),
      description: t("pro.description"),
      features: t.raw("pro.features") as string[],
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--color-bg-secondary)]">
      {/* Header */}
      <header className="bg-[var(--color-bg)] border-b border-[var(--color-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🐾</span>
            <span className="text-xl font-bold text-[var(--color-primary)]">
              Find My Pet
            </span>
          </Link>
          {session?.user && (
            <Link
              href="/dashboard"
              className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
            >
              ← Dashboard
            </Link>
          )}
        </div>
      </header>

      {/* Title */}
      <div className="text-center py-12 px-4">
        <h1 className="text-4xl font-bold text-[var(--color-text)] mb-4">
          {t("title")}
        </h1>
        <p className="text-lg text-[var(--color-text-secondary)] max-w-2xl mx-auto">
          {t("subtitle")}
        </p>
      </div>

      {/* Plans Grid (Client component for checkout interaction) */}
      <PlansGrid
        plans={plans}
        currentPlanSlug={currentPlanSlug}
        isLoggedIn={!!session?.user}
        locale={locale}
      />
    </div>
  );
}
