// skillbridge/src/services/profileService.ts
import { adminDb } from "@/lib/firebaseAdmin";
import admin from "firebase-admin";

const usersRef = adminDb.collection("users");

function defaultProfile(uid: string) {
  return {
    uid,
    name: "",
    email: "",
    timezone: "UTC",
    profile: {},
    teachingSkills: [],
    learningSkills: [],
    points: 0,
    createdAt: new Date().toISOString(),
  };
}

export async function getProfile(uid: string) {
  const doc = await usersRef.doc(uid).get();
  if (!doc.exists) {
    const userData = defaultProfile(uid);
    await usersRef.doc(uid).set(userData);
    return userData;
  }
  return doc.data();
}

export async function updateProfile(uid: string, data: any) {
  const updates: any = {};
  if (typeof data.name === "string") updates.name = data.name;
  if (typeof data.timezone === "string") updates.timezone = data.timezone;
  if (data.profile && typeof data.profile === "object") updates.profile = data.profile;
  await usersRef.doc(uid).set(updates, { merge: true });
  const updated = await usersRef.doc(uid).get();
  return updated.data();
}

export async function addSkill(uid: string, type: "teaching" | "learning", skill: string) {
  const field = type === "teaching" ? "teachingSkills" : "learningSkills";
  const normalized = skill.trim();
  if (!normalized) return getProfile(uid);
  await usersRef.doc(uid).update({ [field]: admin.firestore.FieldValue.arrayUnion(normalized) });
  const updated = await usersRef.doc(uid).get();
  return updated.data();
}

export async function removeSkill(uid: string, type: "teaching" | "learning", skill: string) {
  const field = type === "teaching" ? "teachingSkills" : "learningSkills";
  const normalized = skill.trim();
  if (!normalized) return getProfile(uid);
  await usersRef.doc(uid).update({ [field]: admin.firestore.FieldValue.arrayRemove(normalized) });
  const updated = await usersRef.doc(uid).get();
  return updated.data();
}