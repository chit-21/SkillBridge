// src/services/authService.ts
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";

export async function registerUser({ email, password, name, timezone }: { email: string; password: string; name: string; timezone?: string }) {
  // Create user in Firebase Auth
  const userRecord = await adminAuth.createUser({
    email,
    password,
    displayName: name,
  });

  // Firestore user object
  const user = {
    uid: userRecord.uid,
    name,
    email,
    timezone: timezone || "UTC",
    profile: {},
    teachingSkills: [],
    learningSkills: [],
    points: 0,
    createdAt: Date.now(),
  };

  // Save to Firestore users collection
  await adminDb.collection("users").doc(user.uid).set(user);

  // Return sanitized user object (no credentials)
  return user;
}

export async function verifyIdToken(idToken: string) {
  // Will throw if invalid / expired
  return adminAuth.verifyIdToken(idToken);
}
