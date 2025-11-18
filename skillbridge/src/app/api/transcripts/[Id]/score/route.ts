import { NextRequest } from "next/server";
import { computeRelevanceScore } from "@/services/transcriptService";
import { requireAuth } from "@/middlewares/auth.middlewares";
import { jsonError } from "@/lib/utils";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth(req.headers);
    const { id } = await params;
    const score = await computeRelevanceScore(id);
    return new Response(JSON.stringify({ transcriptId: id, relevanceScore: score }), { status: 200 });
  } catch (err: any) {
    return jsonError(err.message);
  }
}
