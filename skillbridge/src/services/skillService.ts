import { adminDb } from "@/lib/firebaseAdmin";
import { Query } from "firebase-admin/firestore";

const SKILLS_COLLECTION = "skills";

export async function createSkill({ name, category, tags }: { name: string; category: string; tags: string[] }) {
  const skillRef = adminDb.collection(SKILLS_COLLECTION).doc();
  const skillData = {
    skillId: skillRef.id,
    name,
    category,
    tags,
    createdAt: new Date().toISOString(),
  };

  await skillRef.set(skillData);
  return skillData;
}

export async function searchSkills(query?: string) {
  // Start as Query<DocumentData>
  let skillsQuery: Query = adminDb.collection(SKILLS_COLLECTION);

  if (query) {
    // Basic search: name contains query (case-insensitive)
    skillsQuery = skillsQuery.where("name", ">=", query).where("name", "<=", query + "\uf8ff");
  }

  const snapshot = await skillsQuery.get();
  const skills: any[] = [];
  snapshot.forEach((doc) => skills.push(doc.data()));
  return skills;
}

export async function getSkillById(skillId: string) {
  const doc = await adminDb.collection(SKILLS_COLLECTION).doc(skillId).get();
  if (!doc.exists) throw new Error("Skill not found");
  return doc.data();
}
