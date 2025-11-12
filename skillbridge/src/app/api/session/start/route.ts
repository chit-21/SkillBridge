import { NextRequest } from "next/server";
import { createSession } from "@/services/sessionService";
import { requireAuth } from "@/middlewares/auth.middlewares";
import { jsonError } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req.headers);
    const { matchId, scheduledAt } = await req.json();

    const session = await createSession(matchId, scheduledAt);
    return new Response(JSON.stringify(session), { status: 201 });
  } catch (err: any) {
    return jsonError(err.message);
  }
}
