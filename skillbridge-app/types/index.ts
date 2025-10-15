import type { Timestamp } from 'firebase-admin/firestore';

export interface Skill {
  skillId: string;
  name: string;
  proficiency: 1 | 2 | 3 | 4 | 5;
  vector?: number[]; 
}

export interface UserProfile {
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  timezone: string;
  availability: Record<string, string[]>; 
  skillPoints: number;
  avgRating: number;
  ratingsCount: number;
  skillsToTeach: Skill[];
  skillsToLearn: Skill[];
}

export interface Match {
  learnerId: string;
  teacherId: string;
  learnerSkillName: string;
  teacherSkillName: string;
  matchScore: number;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Timestamp;
}

export interface Session {
  participants: [string, string]; 
  skillName: string;
  scheduledAt: Timestamp;
  status: 'scheduled' | 'completed' | 'cancelled';
  durationMinutes: number;
  pointsCost: number;
  transcript?: string;
}

export interface Review {
  sessionId: string;
  reviewerId: string;
  teacherId: string;
  rating: number;
  comment: string;
  createdAt: Timestamp;
}

export interface PointsTransaction {
  userId: string;
  amount: number;
  type: 'session_fee' | 'session_payout' | 'signup_bonus';
  relatedSessionId?: string;
  createdAt: Timestamp;
}
