import { adminDb } from "@/lib/firebaseAdmin";

const SESSIONS_COLLECTION = "sessions";

// Schedule new session
export async function createSession(matchId: string, scheduledAt: string) {
  const sessionRef = adminDb.collection(SESSIONS_COLLECTION).doc();
  const sessionData = {
    sessionId: sessionRef.id,
    matchId,
    scheduledAt,
    status: "scheduled",
    roomId: `room-${sessionRef.id}`,
    createdAt: new Date().toISOString(),
  };

  await sessionRef.set(sessionData);
  return sessionData;
}

// Complete session and attach transcript reference
export async function completeSession(sessionId: string, transcriptRef: string) {
  const sessionRef = adminDb.collection(SESSIONS_COLLECTION).doc(sessionId);
  const sessionDoc = await sessionRef.get();

  if (!sessionDoc.exists) throw new Error("Session not found");

  await sessionRef.update({
    status: "completed",
    transcriptRef,
    completedAt: new Date().toISOString(),
  });

  const updatedSession = await sessionRef.get();
  return updatedSession.data();
}
