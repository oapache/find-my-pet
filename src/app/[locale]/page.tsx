import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function HomePage() {
  const t = useTranslations("Landing");
  const tCommon = useTranslations("Common");

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="border-b border-[var(--color-border)] bg-[var(--color-bg)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🐾</span>
            <span className="text-xl font-bold text-[var(--color-primary)]">
              {tCommon("appName")}
            </span>
          </div>
          <nav className="flex items-center gap-4">
            <Link
              href="/auth/signin"
              className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
            >
              {t("hero.ctaSecondary")}
            </Link>
            <Link
              href="/auth/signup"
              className="bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[var(--color-primary-dark)] transition-colors"
            >
              {t("hero.cta")}
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[var(--color-text)]">
            {t("hero.title")}
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-[var(--color-text-secondary)] max-w-3xl mx-auto">
            {t("hero.subtitle")}
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/signup"
              className="bg-[var(--color-primary)] text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-[var(--color-primary-dark)] transition-colors"
            >
              {t("hero.cta")}
            </Link>
            <Link
              href="/plans"
              className="border border-[var(--color-border)] text-[var(--color-text)] px-8 py-3 rounded-lg text-lg font-semibold hover:bg-[var(--color-bg-secondary)] transition-colors"
            >
              {t("hero.ctaSecondary")}
            </Link>
          </div>
        </section>

        {/* Features */}
        <section className="bg-[var(--color-bg-secondary)] py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-16">
              {t("features.title")}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {(
                [
                  { key: "qrCode", icon: "📱" },
                  { key: "profile", icon: "🐕" },
                  { key: "poster", icon: "📋" },
                  { key: "tags", icon: "🏷️" },
                ] as const
              ).map((feature) => (
                <div
                  key={feature.key}
                  className="bg-[var(--color-bg)] p-6 rounded-xl shadow-sm border border-[var(--color-border)] hover:shadow-md transition-shadow"
                >
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <h3 className="text-lg font-semibold mb-2">
                    {t(`features.${feature.key}.title`)}
                  </h3>
                  <p className="text-[var(--color-text-secondary)] text-sm">
                    {t(`features.${feature.key}.description`)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--color-border)] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-[var(--color-text-secondary)]">
          © {new Date().getFullYear()} Find My Pet. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
