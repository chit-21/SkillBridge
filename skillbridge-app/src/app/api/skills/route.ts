import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { listSkills, addSkill } from '../auth/me/firestoreService';
import type { Skill } from '@/types';

function extractBearerToken(req: NextRequest): string | null {
  const auth = req.headers.get('authorization') || req.headers.get('Authorization');
  if (!auth) return null;
  const [scheme, token] = auth.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null;
  return token;
}

export async function GET() {
  const skills = await listSkills();
  return NextResponse.json(skills);
}

export async function POST(req: NextRequest) {
  try {
    const token = extractBearerToken(req);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await admin.auth().verifyIdToken(token);

    const body = (await req.json()) as Skill;
    if (!body?.skillId || !body?.name || !body?.proficiency) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    await addSkill(body);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
