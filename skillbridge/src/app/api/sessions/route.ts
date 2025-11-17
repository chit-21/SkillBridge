import { NextRequest } from "next/server";
import { getUserSessions } from "@/services/sessionService";
import { requireAuth } from "@/middlewares/auth.middlewares";
import { jsonError } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req.headers);
    const sessions = await getUserSessions(user.uid);
    return new Response(JSON.stringify(sessions), { status: 200 });
  } catch (err: any) {
    return jsonError(err.message);
  }
}

