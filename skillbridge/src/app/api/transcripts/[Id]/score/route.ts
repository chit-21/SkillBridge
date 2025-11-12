import { NextRequest } from "next/server";
import { computeRelevanceScore } from "@/services/transcriptService";
import { requireAuth } from "@/middlewares/auth.middlewares";
import { jsonError } from "@/lib/utils";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuth(req.headers);
    const score = await computeRelevanceScore(params.id);
    return new Response(JSON.stringify({ transcriptId: params.id, relevanceScore: score }), { status: 200 });
  } catch (err: any) {
    return jsonError(err.message);
  }
}
