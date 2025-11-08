import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";

export async function GET() {
  try {
    // 🔹 Test Firestore
    const testDoc = adminDb.collection("test").doc("hello");
    await testDoc.set({ message: "Firestore connected!", timestamp: new Date() });
    const data = (await testDoc.get()).data();

    // 🔹 Test Auth
    const users = await adminAuth.listUsers(1); // fetch 1 user if exists
    const firstUser = users.users[0]?.email || "No users found";

    //  🔹 Test environment variables
    const envCheck = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL ? "Loaded ✅" : "Missing ❌",
    };

    return NextResponse.json({
      success: true,
      firestore: data,
      auth: firstUser,
      env: envCheck,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
