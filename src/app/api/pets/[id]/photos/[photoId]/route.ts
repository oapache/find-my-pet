import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; photoId: string }> }
) {
  try {
    const { id, photoId } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Verify ownership via pet
    const photo = await db.petPhoto.findFirst({
      where: { id: photoId, petId: id, pet: { userId: session.user.id } },
    });

    if (!photo) {
      return NextResponse.json(
        { error: "Foto não encontrada" },
        { status: 404 }
      );
    }

    await db.petPhoto.delete({ where: { id: photoId } });

    // If deleted photo was primary, set next one as primary
    if (photo.isPrimary) {
      const next = await db.petPhoto.findFirst({
        where: { petId: id },
        orderBy: { sortOrder: "asc" },
      });
      if (next) {
        await db.petPhoto.update({
          where: { id: next.id },
          data: { isPrimary: true },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting photo:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; photoId: string }> }
) {
  try {
    const { id, photoId } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const photo = await db.petPhoto.findFirst({
      where: { id: photoId, petId: id, pet: { userId: session.user.id } },
    });

    if (!photo) {
      return NextResponse.json(
        { error: "Foto não encontrada" },
        { status: 404 }
      );
    }

    const body = await req.json();

    // Set as primary: unset all others first
    if (body.isPrimary) {
      await db.petPhoto.updateMany({
        where: { petId: id },
        data: { isPrimary: false },
      });
      await db.petPhoto.update({
        where: { id: photoId },
        data: { isPrimary: true },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating photo:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
