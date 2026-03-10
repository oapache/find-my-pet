"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { PhotoUpload } from "@/components/photo-upload";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PetPhoto {
  id: string;
  urlThumb: string;
  urlMedium: string;
  isPrimary: boolean;
}

interface PetFormValues {
  name: string;
  species: "dog" | "cat" | "bird" | "other";
  breed: string;
  color: string;
  size: "" | "small" | "medium" | "large";
  weightKg: string;
  birthDate: string;
  gender: "" | "male" | "female" | "unknown";
  microchipId: string;
  description: string;
  medicalNotes: string;
  isPublic: boolean;
}

interface PetFormProps {
  /** When provided the form is in edit mode */
  petId?: string;
  initialValues?: Partial<PetFormValues>;
  initialPhotos?: PetPhoto[];
  maxPhotos?: number;
}

const EMPTY: PetFormValues = {
  name: "",
  species: "dog",
  breed: "",
  color: "",
  size: "",
  weightKg: "",
  birthDate: "",
  gender: "",
  microchipId: "",
  description: "",
  medicalNotes: "",
  isPublic: true,
};

// ─── Component ────────────────────────────────────────────────────────────────

export function PetForm({
  petId,
  initialValues,
  initialPhotos = [],
  maxPhotos = 3,
}: PetFormProps) {
  const t = useTranslations("PetForm");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const isEdit = !!petId;

  const [values, setValues] = useState<PetFormValues>({
    ...EMPTY,
    ...initialValues,
  });
  const [error, setError] = useState<string | null>(null);

  // ── Photos: shown only in edit mode (petId provided as prop) ───────────────
  const showPhotos = isEdit && petId;

  const set = <K extends keyof PetFormValues>(key: K, val: PetFormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: val }));

  // ── Submit ──────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const payload: Record<string, unknown> = {
      name: values.name.trim(),
      species: values.species,
      breed: values.breed.trim() || undefined,
      color: values.color.trim() || undefined,
      size: values.size || undefined,
      weightKg: values.weightKg ? parseFloat(values.weightKg) : undefined,
      birthDate: values.birthDate || undefined,
      gender: values.gender || undefined,
      microchipId: values.microchipId.trim() || undefined,
      description: values.description.trim() || undefined,
      medicalNotes: values.medicalNotes.trim() || undefined,
      isPublic: values.isPublic,
    };

    startTransition(async () => {
      try {
        const url = isEdit ? `/api/pets/${petId}` : "/api/pets";
        const method = isEdit ? "PATCH" : "POST";

        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();

        if (!res.ok) {
          if (data.code === "PET_LIMIT_REACHED") {
            setError(
              "Limite de pets atingido. Faça upgrade do seu plano para adicionar mais pets."
            );
          } else {
            setError(data.error ?? "Erro ao salvar pet.");
          }
          return;
        }

        if (!isEdit) {
          // Redirect to edit page so user can upload photos right away
          router.push(`/dashboard/pets/${data.pet.id}`);
        } else {
          router.push("/dashboard");
        }
      } catch {
        setError("Erro de conexão. Tente novamente.");
      }
    });
  };

  // ── Field helpers ───────────────────────────────────────────────────────────

  const inputClass =
    "w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm placeholder-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition";

  const labelClass = "block text-sm font-medium mb-1";

  const selectClass = `${inputClass} appearance-none`;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ── Section: Informações básicas ── */}
      <section className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl p-5 space-y-4">
        <h2 className="font-semibold text-base">Informações básicas</h2>

        {/* Name */}
        <div>
          <label className={labelClass}>{t("name")} *</label>
          <input
            type="text"
            required
            maxLength={100}
            value={values.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Ex: Rex, Luna, Bolinha…"
            className={inputClass}
          />
        </div>

        {/* Species + Breed */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>{t("species")} *</label>
            <select
              required
              value={values.species}
              onChange={(e) =>
                set("species", e.target.value as PetFormValues["species"])
              }
              className={selectClass}
            >
              <option value="dog">{t("speciesOptions.dog")}</option>
              <option value="cat">{t("speciesOptions.cat")}</option>
              <option value="bird">{t("speciesOptions.bird")}</option>
              <option value="other">{t("speciesOptions.other")}</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>{t("breed")}</label>
            <input
              type="text"
              maxLength={100}
              value={values.breed}
              onChange={(e) => set("breed", e.target.value)}
              placeholder="Ex: Golden Retriever, SRD…"
              className={inputClass}
            />
          </div>
        </div>

        {/* Color + Size */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>{t("color")}</label>
            <input
              type="text"
              maxLength={100}
              value={values.color}
              onChange={(e) => set("color", e.target.value)}
              placeholder="Ex: Caramelo, Preto e branco…"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>{t("size")}</label>
            <select
              value={values.size}
              onChange={(e) =>
                set("size", e.target.value as PetFormValues["size"])
              }
              className={selectClass}
            >
              <option value="">— Selecione —</option>
              <option value="small">{t("sizeOptions.small")}</option>
              <option value="medium">{t("sizeOptions.medium")}</option>
              <option value="large">{t("sizeOptions.large")}</option>
            </select>
          </div>
        </div>

        {/* Weight + Birth date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>{t("weight")}</label>
            <input
              type="number"
              min={0}
              max={500}
              step={0.1}
              value={values.weightKg}
              onChange={(e) => set("weightKg", e.target.value)}
              placeholder="Ex: 8.5"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>{t("birthDate")}</label>
            <input
              type="date"
              max={new Date().toISOString().split("T")[0]}
              value={values.birthDate}
              onChange={(e) => set("birthDate", e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        {/* Gender + Microchip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>{t("gender")}</label>
            <select
              value={values.gender}
              onChange={(e) =>
                set("gender", e.target.value as PetFormValues["gender"])
              }
              className={selectClass}
            >
              <option value="">— Selecione —</option>
              <option value="male">{t("genderOptions.male")}</option>
              <option value="female">{t("genderOptions.female")}</option>
              <option value="unknown">{t("genderOptions.unknown")}</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>{t("microchipId")}</label>
            <input
              type="text"
              maxLength={50}
              value={values.microchipId}
              onChange={(e) => set("microchipId", e.target.value)}
              placeholder="Número do microchip"
              className={inputClass}
            />
          </div>
        </div>
      </section>

      {/* ── Section: Descrição ── */}
      <section className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl p-5 space-y-4">
        <h2 className="font-semibold text-base">Descrição e notas</h2>

        <div>
          <label className={labelClass}>{t("description")}</label>
          <textarea
            rows={3}
            maxLength={2000}
            value={values.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder={t("descriptionPlaceholder")}
            className={`${inputClass} resize-none`}
          />
          <p className="text-xs text-[var(--color-text-secondary)] mt-1 text-right">
            {values.description.length}/2000
          </p>
        </div>

        <div>
          <label className={labelClass}>Notas médicas</label>
          <textarea
            rows={3}
            maxLength={2000}
            value={values.medicalNotes}
            onChange={(e) => set("medicalNotes", e.target.value)}
            placeholder="Alergias, medicamentos, condições de saúde…"
            className={`${inputClass} resize-none`}
          />
        </div>

        {/* Public toggle */}
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <div
            role="checkbox"
            aria-checked={values.isPublic}
            tabIndex={0}
            onKeyDown={(e) =>
              e.key === "Enter" && set("isPublic", !values.isPublic)
            }
            onClick={() => set("isPublic", !values.isPublic)}
            className={`relative w-10 h-6 rounded-full transition-colors ${
              values.isPublic
                ? "bg-[var(--color-primary)]"
                : "bg-[var(--color-border)]"
            }`}
          >
            <span
              className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                values.isPublic ? "left-5" : "left-1"
              }`}
            />
          </div>
          <span className="text-sm">
            Perfil público — qualquer pessoa com o link pode ver
          </span>
        </label>
      </section>

      {/* ── Section: Fotos ── */}
      {showPhotos && petId && (
        <section className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl p-5 space-y-3">
          <h2 className="font-semibold text-base">{t("photos")}</h2>
          <p className="text-sm text-[var(--color-text-secondary)]">
            {t("photosHint", { max: maxPhotos })}
          </p>
          <PhotoUpload
            petId={petId}
            initialPhotos={initialPhotos}
            maxPhotos={maxPhotos}
          />
        </section>
      )}

      {/* ── Error ── */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {/* ── Actions ── */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 sm:flex-none bg-[var(--color-primary)] text-white px-6 py-2.5 rounded-lg font-medium text-sm hover:bg-[var(--color-primary-dark)] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? t("submitting") : t("submit")}
        </button>
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="flex-1 sm:flex-none text-[var(--color-text-secondary)] border border-[var(--color-border)] px-6 py-2.5 rounded-lg font-medium text-sm hover:bg-[var(--color-bg-secondary)] transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
