import { auth } from "@/lib/auth";
import { redirect } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { db } from "@/lib/db";
import { getTranslations } from "next-intl/server";
import { PetForm } from "@/components/pet-form";

export default async function NewPetPage({
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

  const t = await getTranslations({ locale, namespace: "PetForm" });

  // Check pet limit before even showing the form
  const [petCount, subscription] = await Promise.all([
    db.pet.count({ where: { userId: session.user.id } }),
    db.subscription.findFirst({
      where: { userId: session.user.id, status: "active" },
      include: { plan: true },
    }),
  ]);

  const maxPets = subscription?.plan?.maxPets ?? 1;
  const maxPhotos = subscription?.plan?.maxPhotosPerPet ?? 3;

  if (petCount >= maxPets) {
    redirect({ href: "/plans", locale });
    return null;
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-secondary)]">
      {/* Header */}
      <header className="bg-[var(--color-bg)] border-b border-[var(--color-border)]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
          <Link
            href="/dashboard"
            className="text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
            aria-label="Voltar"
          >
            ←
          </Link>
          <h1 className="text-lg font-semibold">{t("title")}</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <PetForm maxPhotos={maxPhotos} />
      </main>
    </div>
  );
}
