import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashIP } from "@/lib/utils";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const link = await db.affiliateLink.findUnique({
      where: { slug },
      include: { partner: true },
    });

    if (!link || !link.isActive || !link.partner.isActive) {
      return NextResponse.json({ error: "Link não encontrado" }, { status: 404 });
    }

    // Fire-and-forget click logging
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
    const ipHash = await hashIP(ip);

    // Deduplicate: check if same IP clicked this link in last 24h
    const recentClick = await db.affiliateClick.findFirst({
      where: {
        linkId: link.id,
        ipHash,
        clickedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    });

    if (!recentClick) {
      await db.affiliateClick.create({
        data: {
          linkId: link.id,
          ipHash,
          userAgent: req.headers.get("user-agent") || undefined,
          referer: req.headers.get("referer") || undefined,
        },
      });
    }

    // 302 redirect (not 301 — we may change destination)
    return NextResponse.redirect(link.destinationUrl, 302);
  } catch (error) {
    console.error("Affiliate redirect error:", error);
    return NextResponse.redirect(
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      302
    );
  }
}
