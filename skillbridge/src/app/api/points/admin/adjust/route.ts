import { NextRequest } from "next/server";
import { adjustPoints } from "@/services/pointsService";
import { requireAuth } from "@/middlewares/auth.middlewares";
import { jsonError } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req.headers);
    if (!user.isAdmin) return new Response(JSON.stringify({ error: "Admin required" }), { status: 403 });

    const { userId, amount, reason } = await req.json();
    if (!userId || typeof amount !== "number" || !reason) {
      return new Response(JSON.stringify({ error: "userId, amount(number) and reason required" }), { status: 400 });
    }

    const updated = await adjustPoints(userId, amount, reason, user.uid);
    return new Response(JSON.stringify(updated), { status: 200 });
  } catch (err: any) {
    return jsonError(err.message);
  }
}
