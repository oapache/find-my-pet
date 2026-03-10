import { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getAppUrl, calculatePetAge, formatDate } from "@/lib/utils";
import { getTranslations } from "next-intl/server";

export const revalidate = 3600; // ISR: revalidate every hour

interface PageProps {
  params: Promise<{ slug: string; locale: string }>;
}

async function getPet(slug: string) {
  return db.pet.findUnique({
    where: { slug, isPublic: true },
    include: {
      photos: { orderBy: { sortOrder: "asc" } },
      user: { select: { name: true, phone: true } },
      qrCodes: { where: { isActive: true }, take: 1 },
    },
  });
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const pet = await getPet(slug);

  if (!pet) {
    return { title: "Pet não encontrado" };
  }

  const appUrl = getAppUrl();
  const primaryPhoto = pet.photos.find((p) => p.isPrimary) || pet.photos[0];

  return {
    title: pet.isLost ? `🚨 PERDIDO: ${pet.name}` : pet.name,
    description: pet.isLost
      ? `Ajude a encontrar ${pet.name}! ${pet.species}, ${pet.breed || ""}. Visto por último: ${pet.lastSeenLocation || "não informado"}`
      : `Conheça ${pet.name} — ${pet.species}${pet.breed ? `, ${pet.breed}` : ""}`,
    openGraph: {
      title: pet.isLost ? `🚨 PERDIDO: ${pet.name}` : pet.name,
      description: pet.isLost
        ? `Ajude a encontrar ${pet.name}! Visto por último: ${pet.lastSeenLocation || "não informado"}`
        : `Conheça ${pet.name}`,
      images: primaryPhoto
        ? [`${appUrl}/api/og/pet/${pet.id}`]
        : undefined,
      type: "profile",
      url: `${appUrl}/p/${slug}`,
    },
  };
}

export default async function PetProfilePage({ params }: PageProps) {
  const { slug, locale } = await params;
  const t = await getTranslations({ locale, namespace: "PetProfile" });
  const pet = await getPet(slug);

  if (!pet) {
    notFound();
  }

  const primaryPhoto = pet.photos.find((p) => p.isPrimary) || pet.photos[0];
  const age = pet.birthDate ? calculatePetAge(pet.birthDate) : null;

  const speciesLabels: Record<string, string> = {
    dog: locale === "pt-BR" ? "Cachorro" : "Dog",
    cat: locale === "pt-BR" ? "Gato" : "Cat",
    bird: locale === "pt-BR" ? "Pássaro" : "Bird",
    other: locale === "pt-BR" ? "Outro" : "Other",
  };

  const sizeLabels: Record<string, string> = {
    small: locale === "pt-BR" ? "Pequeno" : "Small",
    medium: locale === "pt-BR" ? "Médio" : "Medium",
    large: locale === "pt-BR" ? "Grande" : "Large",
  };

  const genderLabels: Record<string, string> = {
    male: locale === "pt-BR" ? "Macho" : "Male",
    female: locale === "pt-BR" ? "Fêmea" : "Female",
    unknown: locale === "pt-BR" ? "Não informado" : "Unknown",
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-secondary)]">
      {/* Lost Pet Banner */}
      {pet.isLost && (
        <div className="bg-red-600 text-white py-4 px-4 text-center animate-pulse-danger">
          <p className="text-lg font-bold">
            {t("lostBanner", {
              name: pet.name,
              date: pet.lostSince
                ? formatDate(pet.lostSince, locale)
                : "?",
            })}
          </p>
          {pet.lastSeenLocation && (
            <p className="text-sm mt-1">
              {t("lastSeen", { location: pet.lastSeenLocation })}
            </p>
          )}
        </div>
      )}

      <div className="max-w-2xl mx-auto p-4 sm:p-6">
        {/* Pet Photo */}
        {primaryPhoto && (
          <div className="rounded-2xl overflow-hidden shadow-lg mb-6">
            <img
              src={primaryPhoto.urlFull}
              alt={pet.name}
              className="w-full h-auto object-cover max-h-[500px]"
              loading="eager"
            />
          </div>
        )}

        {/* Pet Header */}
        <div className="bg-[var(--color-bg)] rounded-2xl shadow-sm p-6 mb-4">
          <h1 className="text-3xl font-bold text-[var(--color-text)]">
            {pet.isLost && (
              <span className="text-red-600 mr-2">🚨</span>
            )}
            {pet.name}
          </h1>
          <p className="text-[var(--color-text-secondary)] mt-1">
            {speciesLabels[pet.species] || pet.species}
            {pet.breed && ` • ${pet.breed}`}
          </p>
        </div>

        {/* Pet Details */}
        <div className="bg-[var(--color-bg)] rounded-2xl shadow-sm p-6 mb-4">
          <div className="grid grid-cols-2 gap-4">
            {pet.color && (
              <DetailItem label={t("color")} value={pet.color} />
            )}
            {pet.size && (
              <DetailItem
                label={t("size")}
                value={sizeLabels[pet.size] || pet.size}
              />
            )}
            {pet.weightKg && (
              <DetailItem
                label={t("weight")}
                value={`${pet.weightKg} kg`}
              />
            )}
            {age && (
              <DetailItem
                label={t("age")}
                value={
                  age.years > 0
                    ? `${age.years} ${age.years === 1 ? "ano" : "anos"}${age.months > 0 ? ` e ${age.months} ${age.months === 1 ? "mês" : "meses"}` : ""}`
                    : `${age.months} ${age.months === 1 ? "mês" : "meses"}`
                }
              />
            )}
            {pet.gender && (
              <DetailItem
                label={t("gender")}
                value={genderLabels[pet.gender] || pet.gender}
              />
            )}
            {pet.microchipId && (
              <DetailItem label={t("microchip")} value={pet.microchipId} />
            )}
          </div>
        </div>

        {/* Description */}
        {pet.description && (
          <div className="bg-[var(--color-bg)] rounded-2xl shadow-sm p-6 mb-4">
            <h2 className="text-lg font-semibold mb-2">
              {t("description", { name: pet.name })}
            </h2>
            <p className="text-[var(--color-text-secondary)] whitespace-pre-wrap">
              {pet.description}
            </p>
          </div>
        )}

        {/* Contact */}
        {pet.isLost && pet.user.phone && (
          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl shadow-sm p-6 mb-4">
            <h2 className="text-lg font-semibold mb-3 text-emerald-700 dark:text-emerald-300">
              {t("contact")}
            </h2>
            <a
              href={`tel:${pet.user.phone}`}
              className="block w-full bg-emerald-600 text-white text-center py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
            >
              📞 {t("contactPhone")}
            </a>
          </div>
        )}

        {/* Photo Gallery */}
        {pet.photos.length > 1 && (
          <div className="bg-[var(--color-bg)] rounded-2xl shadow-sm p-6 mb-4">
            <div className="grid grid-cols-3 gap-2">
              {pet.photos.map((photo) => (
                <img
                  key={photo.id}
                  src={photo.urlMedium}
                  alt={pet.name}
                  className="rounded-lg w-full aspect-square object-cover"
                  loading="lazy"
                />
              ))}
            </div>
          </div>
        )}

        {/* QR Code */}
        {pet.qrCodes[0]?.imageUrl && (
          <div className="bg-[var(--color-bg)] rounded-2xl shadow-sm p-6 text-center">
            <p className="text-sm text-[var(--color-text-secondary)] mb-3">
              {t("scanQR")}
            </p>
            <img
              src={pet.qrCodes[0].imageUrl}
              alt="QR Code"
              className="w-40 h-40 mx-auto"
            />
          </div>
        )}

        {/* Footer Brand */}
        <div className="text-center py-6 text-sm text-[var(--color-text-secondary)]">
          <span className="text-lg">🐾</span> Find My Pet
        </div>
      </div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wide">
        {label}
      </dt>
      <dd className="text-[var(--color-text)] mt-0.5">{value}</dd>
    </div>
  );
}
