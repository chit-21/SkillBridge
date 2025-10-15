import type { NextApiResponse } from 'next';
import { withAuth, NextApiRequestWithUser } from '@/lib/authMiddleware';
import { adminDb } from '@/lib/firebaseAdmin';
import type { UserProfile } from '@/types/firestore';

async function handler(req: NextApiRequestWithUser, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { uid, email, name } = req.user;

  try {
    const userRef = adminDb.collection('users').doc(uid); 
    const userDoc = await userRef.get();

    if (userDoc.exists) {
      // User profile already exists, maybe return it or a confirmation
      return res.status(200).json(userDoc.data());
    }

    // Create a new user profile with default values
    const newUserProfile: UserProfile = {
      email: email || '',
      displayName: name || null,
      avatarUrl: null,
      timezone: 'UTC', // Default timezone
      availability: {},
      skillPoints: 10, // Starting points
      avgRating: 0,
      ratingsCount: 0,
      skillsToTeach: [],
      skillsToLearn: [],
    };

    await userRef.set(newUserProfile);

    res.status(201).json(newUserProfile);
  } catch (error) {
    console.error('Error creating user profile:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}

export default withAuth(handler);