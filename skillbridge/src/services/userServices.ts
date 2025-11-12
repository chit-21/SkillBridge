import { adminDb } from "@/lib/firebaseAdmin";

const usersRef = adminDb.collection("users");

export async function getAllUsers() {
  const snapshot = await usersRef.get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getUserById(uid: string) {
  const doc = await usersRef.doc(uid).get();
  if (!doc.exists) throw new Error("User not found");
  return { id: doc.id, ...doc.data() };
}

export async function updateUser(uid: string, data: any) {
  await usersRef.doc(uid).update(data);
  return { message: "User updated successfully" };
}

export async function deleteUser(uid: string) {
  await usersRef.doc(uid).delete();
  return { message: "User deleted successfully" };
}
