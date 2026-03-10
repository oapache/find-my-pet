import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { petSchema } from "@/lib/validations";
import { generatePetSlug } from "@/lib/utils";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const pets = await db.pet.findMany({
      where: { userId: session.user.id },
      include: {
        photos: {
          where: { isPrimary: true },
          take: 1,
        },
        qrCodes: {
          where: { isActive: true },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ pets });
  } catch (error) {
    console.error("Error fetching pets:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = petSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Check pet limit based on plan
    const userPetCount = await db.pet.count({
      where: { userId: session.user.id },
    });

    // Get user's current plan
    const subscription = await db.subscription.findFirst({
      where: {
        userId: session.user.id,
        status: "active",
      },
      include: { plan: true },
    });

    const maxPets = subscription?.plan?.maxPets ?? 1; // Free plan = 1 pet

    if (userPetCount >= maxPets) {
      return NextResponse.json(
        {
          error: "Limite de pets atingido. Faça upgrade do seu plano.",
          code: "PET_LIMIT_REACHED",
        },
        { status: 403 }
      );
    }

    // Generate unique slug
    let slug = generatePetSlug();
    let slugExists = await db.pet.findUnique({ where: { slug } });
    while (slugExists) {
      slug = generatePetSlug();
      slugExists = await db.pet.findUnique({ where: { slug } });
    }

    const pet = await db.pet.create({
      data: {
        ...parsed.data,
        userId: session.user.id,
        slug,
        birthDate: parsed.data.birthDate
          ? new Date(parsed.data.birthDate)
          : undefined,
      },
    });

    return NextResponse.json({ pet }, { status: 201 });
  } catch (error) {
    console.error("Error creating pet:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
