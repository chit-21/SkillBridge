import { NextRequest, NextResponse } from 'next/server';
import { auth as adminAuth } from './firebaseAdmin.server';
import { getUserProfile } from './firestoreService';


function extractBearerToken(req: NextRequest): string | null {
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
  if (!authHeader) return null;

  const [scheme, token] = authHeader.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null;

  return token;
}

export async function GET(req: NextRequest) {
  try {
    const token = extractBearerToken(req);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;

    const user = await getUserProfile(uid);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (err) {
    console.error('Error in /api/auth/me:', err);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
