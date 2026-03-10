import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { uploadPetPhoto, validateImageBuffer } from "@/lib/storage";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Verify ownership
    const pet = await db.pet.findFirst({
      where: { id, userId: session.user.id },
      include: { photos: true },
    });

    if (!pet) {
      return NextResponse.json(
        { error: "Pet não encontrado" },
        { status: 404 }
      );
    }

    // Check photo limit based on plan
    const subscription = await db.subscription.findFirst({
      where: { userId: session.user.id, status: "active" },
      include: { plan: true },
    });

    const maxPhotos = subscription?.plan?.maxPhotosPerPet ?? 3;

    if (pet.photos.length >= maxPhotos) {
      return NextResponse.json(
        { error: "Limite de fotos atingido. Faça upgrade do seu plano." },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "Nenhum arquivo enviado" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Arquivo muito grande. Máximo: 10MB" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Validate image type via magic bytes
    const validation = await validateImageBuffer(buffer);
    if (!validation.valid) {
      return NextResponse.json(
        { error: "Tipo de arquivo não suportado. Use JPEG, PNG ou WebP." },
        { status: 400 }
      );
    }

    // Upload and create variants
    const uploaded = await uploadPetPhoto(buffer, pet.id);

    // Save to database
    const isPrimary = pet.photos.length === 0; // First photo is primary
    const photo = await db.petPhoto.create({
      data: {
        petId: pet.id,
        storageKey: uploaded.storageKey,
        urlThumb: uploaded.urlThumb,
        urlMedium: uploaded.urlMedium,
        urlFull: uploaded.urlFull,
        isPrimary,
        sortOrder: pet.photos.length,
      },
    });

    return NextResponse.json({ photo }, { status: 201 });
  } catch (error) {
    console.error("Error uploading photo:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
