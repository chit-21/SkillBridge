import { NextRequest } from "next/server";
import { getReviewsByUser } from "@/services/reviewService";
import { jsonError } from "@/lib/utils";

export async function GET(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId } = await params;
    const reviews = await getReviewsByUser(userId);
    return new Response(JSON.stringify(reviews), { status: 200 });
  } catch (err: any) {
    return jsonError(err.message);
  }
}
