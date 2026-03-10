import { auth } from "@/lib/auth";
import { redirect } from "@/i18n/navigation";
import { db } from "@/lib/db";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect({ href: "/auth/signin", locale });
    return null;
  }

  const t = await getTranslations({ locale, namespace: "Dashboard" });

  const pets = await db.pet.findMany({
    where: { userId: session.user.id },
    include: {
      photos: { where: { isPrimary: true }, take: 1 },
      qrCodes: { where: { isActive: true }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });

  // Get user's subscription
  const subscription = await db.subscription.findFirst({
    where: { userId: session.user.id, status: "active" },
    include: { plan: true },
  });

  const plan = subscription?.plan;
  const maxPets = plan?.maxPets ?? 1;
  const planName = plan?.slug ?? "free";

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
          <div className="flex items-center gap-4">
            <span className="text-sm text-[var(--color-text-secondary)]">
              {session.user.name}
            </span>
            <form action="/api/auth/signout" method="POST">
              <button
                type="submit"
                className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
              >
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Plan Banner */}
        <div className="bg-[var(--color-bg)] rounded-xl border border-[var(--color-border)] p-4 mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-[var(--color-text-secondary)]">
              {t("plan.title")}
            </p>
            <p className="font-semibold capitalize">
              {t(`plan.${planName}` as "plan.free" | "plan.premium" | "plan.pro")}
            </p>
            <p className="text-xs text-[var(--color-text-secondary)]">
              {t("plan.petsUsed", { count: pets.length, max: maxPets })}
            </p>
          </div>
          {planName === "free" && (
            <Link
              href="/plans"
              className="bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[var(--color-primary-dark)] transition-colors"
            >
              {t("plan.upgrade")}
            </Link>
          )}
        </div>

        {/* Header Row */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          {pets.length < maxPets && (
            <Link
              href="/dashboard/pets/new"
              className="bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[var(--color-primary-dark)] transition-colors"
            >
              + {t("addPet")}
            </Link>
          )}
        </div>

        {/* Pet Grid */}
        {pets.length === 0 ? (
          <div className="bg-[var(--color-bg)] rounded-xl border border-[var(--color-border)] p-12 text-center">
            <div className="text-5xl mb-4">🐾</div>
            <h2 className="text-lg font-semibold mb-2">{t("noPets")}</h2>
            <p className="text-[var(--color-text-secondary)] mb-6">
              {t("noPetsDescription")}
            </p>
            <Link
              href="/dashboard/pets/new"
              className="bg-[var(--color-primary)] text-white px-6 py-3 rounded-lg font-medium hover:bg-[var(--color-primary-dark)] transition-colors inline-block"
            >
              + {t("addPet")}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {pets.map((pet) => {
              const photo = pet.photos[0];
              return (
                <div
                  key={pet.id}
                  className="bg-[var(--color-bg)] rounded-xl border border-[var(--color-border)] overflow-hidden hover:shadow-md transition-shadow"
                >
                  {photo ? (
                    <img
                      src={photo.urlMedium}
                      alt={pet.name}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 bg-[var(--color-bg-secondary)] flex items-center justify-center text-4xl">
                      {pet.species === "dog"
                        ? "🐕"
                        : pet.species === "cat"
                          ? "🐈"
                          : pet.species === "bird"
                            ? "🐦"
                            : "🐾"}
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold">{pet.name}</h3>
                      {pet.isLost && (
                        <span className="bg-red-100 text-red-700 text-xs font-medium px-2 py-1 rounded-full">
                          Perdido
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                      {pet.species === "dog"
                        ? "Cachorro"
                        : pet.species === "cat"
                          ? "Gato"
                          : pet.species === "bird"
                            ? "Pássaro"
                            : "Outro"}
                      {pet.breed && ` • ${pet.breed}`}
                    </p>
                    <div className="flex gap-2">
                      <Link
                        href={`/p/${pet.slug}`}
                        className="flex-1 text-center text-sm py-2 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] transition-colors"
                      >
                        {t("viewProfile")}
                      </Link>
                      <Link
                        href={`/dashboard/pets/${pet.id}`}
                        className="flex-1 text-center text-sm py-2 rounded-lg bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)] transition-colors"
                      >
                        {t("editPet")}
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
