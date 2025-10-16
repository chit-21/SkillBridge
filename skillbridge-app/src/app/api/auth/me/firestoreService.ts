import { firestore } from './firebaseAdmin.server';
import type { Skill } from '@/types';

interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
}

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const userDoc = await firestore.collection('users').doc(uid).get();

  if (!userDoc.exists) {
    return null;
  }

  return userDoc.data() as UserProfile;
};

export const listSkills = async (): Promise<Skill[]> => {
  const snapshot = await firestore.collection('skills').get();

  const skills: Skill[] = snapshot.docs.map(doc => ({
    id: doc.id,
    ...(doc.data() as Omit<Skill, 'id'>),
  }));

  return skills;
};

export const addSkill = async (skill: Omit<Skill, 'id'>): Promise<void> => {
  await firestore.collection('skills').add(skill);
};