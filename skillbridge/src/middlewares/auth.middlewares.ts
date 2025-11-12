// src/middlewares/auth.middleware.ts
import { verifyIdToken } from "@/services/authService";
import { jsonError } from "@/lib/utils";

export async function requireAuth(headers: Headers) {
  const auth = headers.get("authorization") || "";
  if (!auth || !auth.startsWith("Bearer ")) throw new Error("No token provided");
  const token = auth.split(" ")[1];
  const decoded = await verifyIdToken(token);
  return decoded; // contains uid, email, etc.
}

// small wrapper for route usage to return proper Response on failure
export async function requireAuthOrRespond(headers: Headers) {
  try {
    const decoded = await requireAuth(headers);
    return { ok: true, decoded };
  } catch (err: any) {
    return { ok: false, response: jsonError(err.message || "Unauthorized", 401) };
  }
}
