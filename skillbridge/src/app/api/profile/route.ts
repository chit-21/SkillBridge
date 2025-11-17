import { NextRequest } from "next/server";
import { requireAuth } from "@/middlewares/auth.middlewares";
import { jsonError } from "@/lib/utils";
import { getProfile, updateProfile, addSkill, removeSkill } from "@/services/profileService";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req.headers);
    const profile = await getProfile(user.uid);
    return new Response(JSON.stringify(profile), { status: 200 });
  } catch (err: any) {
    return jsonError(err.message);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireAuth(req.headers);
    const body = await req.json();

    const updates: any = {};
    if (typeof body.name === "string") updates.name = body.name;
    if (typeof body.timezone === "string") updates.timezone = body.timezone;
    if (body.profile && typeof body.profile === "object") updates.profile = body.profile;

    const updated = await updateProfile(user.uid, updates);
    return new Response(JSON.stringify(updated), { status: 200 });
  } catch (err: any) {
    return jsonError(err.message);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req.headers);
    const { type, skill } = await req.json();
    if (!skill || (type !== "teaching" && type !== "learning")) {
      return jsonError("type must be 'teaching' or 'learning' and skill is required", 400);
    }
    const updated = await addSkill(user.uid, type, String(skill));
    return new Response(JSON.stringify(updated), { status: 200 });
  } catch (err: any) {
    return jsonError(err.message);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await requireAuth(req.headers);
    const { type, skill } = await req.json();
    if (!skill || (type !== "teaching" && type !== "learning")) {
      return jsonError("type must be 'teaching' or 'learning' and skill is required", 400);
    }
    const updated = await removeSkill(user.uid, type, String(skill));
    return new Response(JSON.stringify(updated), { status: 200 });
  } catch (err: any) {
    return jsonError(err.message);
  }
}