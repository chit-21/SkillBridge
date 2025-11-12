// src/app/api/auth/register/route.ts
import { NextRequest } from "next/server";
import { registerUser } from "@/services/authService";
import { jsonError } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, timezone } = body;
    if (!name || !email || !password) return jsonError("name, email and password required", 400);

    const user = await registerUser({ name, email, password, timezone });
    return new Response(JSON.stringify({ success: true, user }), { status: 201 });
  } catch (err: any) {
    // Admin SDK may throw detailed errors — be careful in prod with messages
    return jsonError(err.message || "Registration failed", 500);
  }
}
