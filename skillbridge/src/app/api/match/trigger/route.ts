import { NextRequest } from "next/server";
import { triggerMatch } from "@/services/matchService";
import { jsonError } from "@/lib/utils";
import { requireAuth } from "@/middlewares/auth.middlewares";

export async function POST(req: NextRequest) {
  try {
    // Require authentication
    const user = await requireAuth(req);

    // Trigger matching for the authenticated user
    const matches = await triggerMatch(user.uid);

    return new Response(JSON.stringify(matches), { status: 200 });
  } catch (err: any) {
    return jsonError(err.message);
  }
}
