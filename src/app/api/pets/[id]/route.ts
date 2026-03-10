import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { petSchema, lostPetSchema } from "@/lib/validations";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const pet = await db.pet.findFirst({
      where: { id, userId: session.user.id },
      include: {
        photos: { orderBy: { sortOrder: "asc" } },
        qrCodes: { where: { isActive: true } },
      },
    });

    if (!pet) {
      return NextResponse.json(
        { error: "Pet não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ pet });
  } catch (error) {
    console.error("Error fetching pet:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function PATCH(
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
    const existingPet = await db.pet.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existingPet) {
      return NextResponse.json(
        { error: "Pet não encontrado" },
        { status: 404 }
      );
    }

    const body = await req.json();

    // Check if this is a lost pet update
    if ("isLost" in body) {
      const parsed = lostPetSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Dados inválidos", details: parsed.error.flatten() },
          { status: 400 }
        );
      }

      const pet = await db.pet.update({
        where: { id },
        data: {
          ...parsed.data,
          lostSince: parsed.data.isLost ? new Date() : null,
        },
      });

      return NextResponse.json({ pet });
    }

    // Regular pet update
    const parsed = petSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const pet = await db.pet.update({
      where: { id },
      data: {
        ...parsed.data,
        birthDate: parsed.data.birthDate
          ? new Date(parsed.data.birthDate)
          : undefined,
      },
    });

    return NextResponse.json({ pet });
  } catch (error) {
    console.error("Error updating pet:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const pet = await db.pet.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!pet) {
      return NextResponse.json(
        { error: "Pet não encontrado" },
        { status: 404 }
      );
    }

    await db.pet.delete({ where: { id } });

    return NextResponse.json({ message: "Pet removido com sucesso" });
  } catch (error) {
    console.error("Error deleting pet:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
