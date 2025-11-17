import { NextRequest } from "next/server";
import { triggerMatch } from "@/services/matchService";
import { jsonError } from "@/lib/utils";
import { requireAuth } from "@/middlewares/auth.middlewares";

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req.headers);
    let body: any = {};
    try { body = await req.json(); } catch {}
    const { query, intent } = body || {};
    const matches = await triggerMatch(user.uid, query, intent);
    return new Response(JSON.stringify(matches), { status: 200 });
  } catch (err: any) {
    return jsonError(err.message);
  }
}
