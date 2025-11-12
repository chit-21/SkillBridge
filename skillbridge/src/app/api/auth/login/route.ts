// src/app/api/auth/login/route.ts
import { NextRequest } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { jsonError } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json();
    if (!idToken) return jsonError("idToken required", 400);

    const decoded = await adminAuth.verifyIdToken(idToken);
    const userDoc = await adminDb.collection("users").doc(decoded.uid).get();
    const user = userDoc.exists ? userDoc.data() : null;

    return new Response(JSON.stringify({ success: true, user, decoded }), { status: 200 });
  } catch (err: any) {
    return jsonError(err.message || "Token verification failed", 401);
  }
}
