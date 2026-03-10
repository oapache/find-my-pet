import { renderToBuffer } from "@react-pdf/renderer";
import { db } from "@/lib/db";
import { uploadPublicFile, getPrivateFile } from "@/lib/storage";
import { getTemplate, getTemplatesForPlan } from "./templates";
import type { PosterData } from "./templates";
import { getAppUrl } from "@/lib/utils";
import QRCode from "qrcode";

export interface GeneratePosterOptions {
  petId: string;
  userId: string;
  templateId: string;
  locale: string;
}

export interface GeneratePosterResult {
  posterId: string;
  downloadUrl: string;
}

/**
 * Determine the user's active plan slug.
 * Falls back to "free" if no active subscription.
 */
async function getUserPlanSlug(userId: string): Promise<string> {
  const subscription = await db.subscription.findFirst({
    where: { userId, status: "active" },
    include: { plan: true },
    orderBy: { createdAt: "desc" },
  });
  return subscription?.plan?.slug ?? "free";
}

/**
 * Fetch pet photo as base64 data URI for embedding in PDF.
 */
async function getPetPhotoBase64(petId: string): Promise<string | undefined> {
  const primaryPhoto = await db.petPhoto.findFirst({
    where: { petId, isPrimary: true },
  });
  const photo = primaryPhoto ?? await db.petPhoto.findFirst({ where: { petId } });

  if (!photo) return undefined;

  try {
    // Fetch the full-size image URL directly
    const url = photo.urlFull;
    const response = await fetch(url);
    if (!response.ok) return undefined;

    const buffer = Buffer.from(await response.arrayBuffer());
    const mimeType = response.headers.get("content-type") || "image/webp";
    return `data:${mimeType};base64,${buffer.toString("base64")}`;
  } catch {
    return undefined;
  }
}

/**
 * Generate a QR Code as base64 data URI for the pet's public profile.
 */
async function generateQRBase64(slug: string): Promise<string> {
  const url = `${getAppUrl()}/p/${slug}`;
  return QRCode.toDataURL(url, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 300,
    color: { dark: "#000000", light: "#ffffff" },
  });
}

/**
 * Generate a lost pet poster PDF.
 *
 * 1. Validates user owns the pet and has access to the template
 * 2. Gathers pet data, photo, QR code
 * 3. Renders PDF via @react-pdf/renderer
 * 4. Uploads to MinIO and saves record in DB
 */
export async function generatePoster(
  options: GeneratePosterOptions
): Promise<GeneratePosterResult> {
  const { petId, userId, templateId, locale } = options;

  // 1. Load pet with ownership check
  const pet = await db.pet.findFirst({
    where: { id: petId, userId },
    include: { user: true },
  });

  if (!pet) {
    throw new Error("PET_NOT_FOUND");
  }

  // 2. Check plan access to template
  const planSlug = await getUserPlanSlug(userId);
  const availableTemplates = getTemplatesForPlan(planSlug);
  const template = getTemplate(templateId);

  if (!template) {
    throw new Error("TEMPLATE_NOT_FOUND");
  }

  if (!availableTemplates.find((t) => t.id === templateId)) {
    throw new Error("TEMPLATE_NOT_AVAILABLE");
  }

  // 3. Gather data for the poster
  const [photoBase64, qrCodeBase64] = await Promise.all([
    getPetPhotoBase64(petId),
    generateQRBase64(pet.slug),
  ]);

  const posterData: PosterData = {
    pet: {
      name: pet.name,
      species: pet.species,
      breed: pet.breed,
      color: pet.color,
      size: pet.size,
      gender: pet.gender,
      description: pet.description,
      lastSeenLocation: pet.lastSeenLocation,
    },
    photoBase64,
    qrCodeBase64,
    contact: {
      name: pet.user.name,
      phone: pet.user.phone,
    },
    locale,
  };

  // 4. Render the PDF
  const TemplateComponent = template.component;
  const pdfBuffer = await renderToBuffer(
    <TemplateComponent {...posterData} />
  );

  // 5. Upload to storage
  const timestamp = Date.now();
  const storageKey = `posters/${petId}/${templateId}_${timestamp}.pdf`;
  const downloadUrl = await uploadPublicFile(
    storageKey,
    Buffer.from(pdfBuffer),
    "application/pdf"
  );

  // 6. Save poster record
  const poster = await db.poster.create({
    data: {
      petId,
      templateId,
      storageKey,
      downloadUrl,
      locale,
    },
  });

  return {
    posterId: poster.id,
    downloadUrl,
  };
}

/**
 * List available poster templates for a user's plan.
 */
export async function listTemplatesForUser(userId: string) {
  const planSlug = await getUserPlanSlug(userId);
  const templates = getTemplatesForPlan(planSlug);
  return templates.map((t) => ({
    id: t.id,
    namePt: t.namePt,
    nameEn: t.nameEn,
    tier: t.tier,
  }));
}
