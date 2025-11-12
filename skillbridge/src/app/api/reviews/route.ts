import { NextRequest } from "next/server";
import { addReview } from "@/services/reviewService";
import { requireAuth } from "@/middlewares/auth.middlewares";
import { jsonError } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req.headers);
    const body = await req.json();

    // Allow either client to provide fromUser or use authenticated user
    const review = await addReview({
      sessionId: body.sessionId,
      fromUser: body.fromUser || user.uid,
      toUser: body.toUser,
      rating: body.rating,
      comments: body.comments,
    });

    return new Response(JSON.stringify(review), { status: 201 });
  } catch (err: any) {
    return jsonError(err.message);
  }
}
