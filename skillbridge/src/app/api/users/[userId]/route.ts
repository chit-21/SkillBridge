// src/app/api/users/[userId]/route.ts
import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { jsonError } from "@/lib/utils";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    
    if (!userId) {
      return jsonError("User ID required", 400);
    }

    const userDoc = await adminDb.collection("users").doc(userId).get();
    
    if (!userDoc.exists) {
      return jsonError("User not found", 404);
    }

    const userData = userDoc.data();
    
    return new Response(JSON.stringify(userData), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return jsonError(err.message || "Failed to fetch user", 500);
  }
}
