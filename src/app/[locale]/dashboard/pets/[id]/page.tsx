import { auth } from "@/lib/auth";
import { redirect, Link } from "@/i18n/navigation";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { PetForm } from "@/components/pet-form";
import { ReportLostButton } from "@/components/report-lost-button";
import { GenerateQRButton } from "@/components/generate-qr-button";
import { DeletePetButton } from "@/components/delete-pet-button";

interface Props {
  params: Promise<{ locale: string; id: string }>;
}

export default async function EditPetPage({ params }: Props) {
  const { locale, id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect({ href: "/auth/signin", locale });
    return null;
  }

  const t = await getTranslations({ locale, namespace: "PetForm" });

  const [pet, subscription] = await Promise.all([
    db.pet.findFirst({
      where: { id, userId: session.user.id },
      include: {
        photos: { orderBy: { sortOrder: "asc" } },
        qrCodes: { where: { isActive: true }, take: 1 },
      },
    }),
    db.subscription.findFirst({
      where: { userId: session.user.id, status: "active" },
      include: { plan: true },
    }),
  ]);

  if (!pet) notFound();

  const maxPhotos = subscription?.plan?.maxPhotosPerPet ?? 3;

  const initialValues = {
    name: pet.name,
    species: pet.species as "dog" | "cat" | "bird" | "other",
    breed: pet.breed ?? "",
    color: pet.color ?? "",
    size: (pet.size ?? "") as "" | "small" | "medium" | "large",
    weightKg: pet.weightKg ? String(pet.weightKg) : "",
    birthDate: pet.birthDate
      ? new Date(pet.birthDate).toISOString().split("T")[0]
      : "",
    gender: (pet.gender ?? "") as "" | "male" | "female" | "unknown",
    microchipId: pet.microchipId ?? "",
    description: pet.description ?? "",
    medicalNotes: pet.medicalNotes ?? "",
    isPublic: pet.isPublic,
  };

  const initialPhotos = pet.photos.map((p) => ({
    id: p.id,
    urlThumb: p.urlThumb,
    urlMedium: p.urlMedium,
    isPrimary: p.isPrimary,
  }));

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
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold truncate">
              {t("editTitle")} — {pet.name}
            </h1>
          </div>
          <Link
            href={`/p/${pet.slug}`}
            target="_blank"
            className="text-sm text-[var(--color-primary)] hover:underline shrink-0"
          >
            Ver perfil público ↗
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Status banner for lost pets */}
        {pet.isLost && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm font-medium animate-pulse-danger">
            ⚠️ {pet.name} está marcado como perdido
            {pet.lastSeenLocation && (
              <span className="font-normal">
                {" "}
                — Visto por último em: {pet.lastSeenLocation}
              </span>
            )}
          </div>
        )}

        {/* Edit form */}
        <PetForm
          petId={pet.id}
          initialValues={initialValues}
          initialPhotos={initialPhotos}
          maxPhotos={maxPhotos}
        />

        {/* Report lost / found */}
        <section className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl p-5">
          <h2 className="font-semibold text-base mb-3">Status do pet</h2>
          <ReportLostButton
            petId={pet.id}
            isLost={pet.isLost}
            petName={pet.name}
          />
        </section>

        {/* Quick actions */}
        <section className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl p-5 space-y-3">
          <h2 className="font-semibold text-base">Ações rápidas</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link
              href={`/p/${pet.slug}`}
              target="_blank"
              className="flex items-center gap-3 p-3 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] transition-colors"
            >
              <span className="text-2xl">👁️</span>
              <div>
                <p className="text-sm font-medium">Ver perfil público</p>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  Como quem encontrou vai ver
                </p>
              </div>
            </Link>

            {pet.qrCodes[0] ? (
              <div className="flex items-center gap-3 p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
                <span className="text-2xl">✅</span>
                <div>
                  <p className="text-sm font-medium">QR Code gerado</p>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    Disponível no perfil público
                  </p>
                </div>
              </div>
            ) : (
              <GenerateQRButton petId={pet.id} />
            )}
          </div>
        </section>

        {/* Danger zone */}
        <section className="bg-[var(--color-bg)] border border-red-200 rounded-xl p-5 space-y-3">
          <h2 className="font-semibold text-base text-red-700">Zona perigosa</h2>
          <DeletePetButton petId={pet.id} petName={pet.name} />
        </section>
      </main>
    </div>
  );
}


