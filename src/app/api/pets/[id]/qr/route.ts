import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { uploadPublicFile } from "@/lib/storage";
import { getAppUrl } from "@/lib/utils";
import QRCode from "qrcode";

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

    const pet = await db.pet.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!pet) {
      return NextResponse.json(
        { error: "Pet não encontrado" },
        { status: 404 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const style = body.style || {};

    // Check if user has premium for styled QR
    const subscription = await db.subscription.findFirst({
      where: { userId: session.user.id, status: "active" },
      include: { plan: true },
    });

    const canCustomize = subscription?.plan?.customQr ?? false;

    // Generate QR Code URL — always points to the pet's public profile
    const petUrl = `${getAppUrl()}/p/${pet.slug}`;

    // For basic QR (free tier), use the simple qrcode library
    const qrOptions: QRCode.QRCodeToBufferOptions = {
      errorCorrectionLevel: canCustomize && style.logo ? "H" : "M",
      width: 1024,
      margin: 2,
      color: {
        dark: canCustomize ? style.colorForeground || "#000000" : "#000000",
        light: canCustomize ? style.colorBackground || "#ffffff" : "#ffffff",
      },
    };

    const qrBuffer = await QRCode.toBuffer(petUrl, qrOptions);

    // Upload QR to storage
    const styleHash = canCustomize
      ? Buffer.from(JSON.stringify(style)).toString("base64url").slice(0, 8)
      : "basic";
    const storageKey = `qr/${pet.id}_${styleHash}.png`;
    const imageUrl = await uploadPublicFile(storageKey, qrBuffer, "image/png");

    // Deactivate previous QR codes
    await db.qRCode.updateMany({
      where: { petId: pet.id, isActive: true },
      data: { isActive: false },
    });

    // Save new QR code
    const qrCode = await db.qRCode.create({
      data: {
        petId: pet.id,
        style: canCustomize ? style : {},
        imageStorageKey: storageKey,
        imageUrl,
        errorCorrection: canCustomize && style.logo ? "H" : "M",
        isActive: true,
      },
    });

    return NextResponse.json({ qrCode, imageUrl }, { status: 201 });
  } catch (error) {
    console.error("Error generating QR:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
