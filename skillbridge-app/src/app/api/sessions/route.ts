import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { createSession, updateSessionStatus } from '../../../../lib/firestoreService';
import type { Session } from '../../../../types';

function extractBearerToken(req: NextRequest): string | null {
  const auth = req.headers.get('authorization') || req.headers.get('Authorization');
  if (!auth) return null;
  const [scheme, token] = auth.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null;
  return token;
}

export async function POST(req: NextRequest) {
  try {
    const token = extractBearerToken(req);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { uid } = await admin.auth().verifyIdToken(token);

    const payload = (await req.json()) as Session;
    if (!payload?.participants || !payload?.skillName || !payload?.scheduledAt || !payload?.durationMinutes || !payload?.pointsCost) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const id = await createSession(payload);
    return NextResponse.json({ id }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const token = extractBearerToken(req);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await admin.auth().verifyIdToken(token);

    const { sessionId, status } = (await req.json()) as { sessionId: string; status: Session['status'] };
    if (!sessionId || !status) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    await updateSessionStatus(sessionId, status);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
