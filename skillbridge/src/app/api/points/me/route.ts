import { NextRequest } from "next/server";
import { getPoints } from "@/services/pointsService";
import { requireAuth } from "@/middlewares/auth.middlewares";
import { jsonError } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req.headers);
    const points = await getPoints(user.uid);
    return new Response(JSON.stringify(points), { status: 200 });
  } catch (err: any) {
    return jsonError(err.message);
  }
}
