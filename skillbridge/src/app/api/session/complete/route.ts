import { NextRequest } from "next/server";
import { completeSession } from "@/services/sessionService";
import { requireAuth } from "@/middlewares/auth.middlewares";
import { jsonError } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req.headers);
    const { sessionId, transcriptRef } = await req.json();

    const session = await completeSession(sessionId, transcriptRef);
    return new Response(JSON.stringify(session), { status: 200 });
  } catch (err: any) {
    return jsonError(err.message);
  }
}
