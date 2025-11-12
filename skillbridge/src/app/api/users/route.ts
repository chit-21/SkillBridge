import { NextRequest } from "next/server";
import { getAllUsers, getUserById, updateUser, deleteUser } from "@/services/userServices";
import { jsonError } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    const users = await getAllUsers();
    return new Response(JSON.stringify(users), { status: 200 });
  } catch (err: any) {
    return jsonError(err.message);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { uid, data } = await req.json();
    const result = await updateUser(uid, data);
    return new Response(JSON.stringify(result), { status: 200 });
  } catch (err: any) {
    return jsonError(err.message);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { uid } = await req.json();
    const result = await deleteUser(uid);
    return new Response(JSON.stringify(result), { status: 200 });
  } catch (err: any) {
    return jsonError(err.message);
  }
}
