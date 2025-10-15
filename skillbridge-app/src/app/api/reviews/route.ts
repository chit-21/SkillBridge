import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { addReview, listReviewsForTeacher } from '../../../../lib/firestoreService';
import type { Review } from '../../../../types';

function extractBearerToken(req: NextRequest): string | null {
  const auth = req.headers.get('authorization') || req.headers.get('Authorization');
  if (!auth) return null;
  const [scheme, token] = auth.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null;
  return token;
}

export async function GET(req: NextRequest) {
  const teacherId = req.nextUrl.searchParams.get('teacherId');
  if (!teacherId) return NextResponse.json({ error: 'teacherId required' }, { status: 400 });
  const reviews = await listReviewsForTeacher(teacherId);
  return NextResponse.json(reviews);
}

export async function POST(req: NextRequest) {
  try {
    const token = extractBearerToken(req);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await admin.auth().verifyIdToken(token);

    const body = (await req.json()) as Review;
    if (!body?.sessionId || !body?.reviewerId || !body?.teacherId || !body?.rating) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const id = await addReview(body);
    return NextResponse.json({ id }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
