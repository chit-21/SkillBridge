// src/lib/firebaseAdmin.ts
import admin from "firebase-admin";

function formatPrivateKey(k?: string) {
  if (!k) return undefined;
  // Remove surrounding quotes (if envvar was quoted) then convert literal \n into real newlines
  return k.replace(/(^"|"$)/g, "").replace(/\\n/g, "\n");
}

const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: formatPrivateKey(process.env.FIREBASE_PRIVATE_KEY),
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  });
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
