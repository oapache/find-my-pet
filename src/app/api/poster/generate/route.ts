import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generatePoster, listTemplatesForUser } from "@/lib/poster";

/**
 * POST /api/poster/generate
 * Generate a lost pet poster PDF.
 *
 * Body: { petId: string, templateId: string, locale?: string }
 * Returns: { posterId: string, downloadUrl: string }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { petId, templateId, locale } = body;

    if (!petId || !templateId) {
      return NextResponse.json(
        { error: "petId and templateId are required" },
        { status: 400 }
      );
    }

    const result = await generatePoster({
      petId,
      userId: session.user.id,
      templateId,
      locale: locale || "pt-BR",
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";

    const errorMap: Record<string, { msg: string; status: number }> = {
      PET_NOT_FOUND: { msg: "Pet not found or access denied", status: 404 },
      TEMPLATE_NOT_FOUND: { msg: "Template not found", status: 404 },
      TEMPLATE_NOT_AVAILABLE: {
        msg: "Upgrade your plan to use this template",
        status: 403,
      },
    };

    const mapped = errorMap[message];
    if (mapped) {
      return NextResponse.json({ error: mapped.msg }, { status: mapped.status });
    }

    console.error("[poster/generate] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate poster" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/poster/generate
 * List available poster templates for the current user's plan.
 *
 * Returns: { templates: PosterTemplate[] }
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const templates = await listTemplatesForUser(session.user.id);
    return NextResponse.json({ templates });
  } catch (error) {
    console.error("[poster/generate] Error:", error);
    return NextResponse.json(
      { error: "Failed to list templates" },
      { status: 500 }
    );
  }
}
