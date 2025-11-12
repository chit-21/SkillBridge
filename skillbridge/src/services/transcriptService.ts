import { adminDb } from "@/lib/firebaseAdmin";

const TRANSCRIPTS_COLLECTION = "transcripts";

export async function uploadTranscript(sessionId: string, text: string) {
  const ref = adminDb.collection(TRANSCRIPTS_COLLECTION).doc();
  const data = {
    transcriptId: ref.id,
    sessionId,
    text,
    relevanceScore: null,
    createdAt: new Date().toISOString(),
  };

  await ref.set(data);
  return data;
}

// simple heuristic relevance: unique keyword count / log(length)
export async function computeRelevanceScore(transcriptId: string) {
  const docRef = adminDb.collection(TRANSCRIPTS_COLLECTION).doc(transcriptId);
  const doc = await docRef.get();
  if (!doc.exists) throw new Error("Transcript not found");

  const data: any = doc.data();
  const text = (data.text || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").trim();
  if (!text) {
    await docRef.update({ relevanceScore: 0 });
    return 0;
  }

  const words = text.split(/\s+/).filter(Boolean);
  const uniqueWords = new Set(words);
  const uniqCount = uniqueWords.size;
  const score = Math.min(1, uniqCount / Math.log(words.length + 10)); // normalized heuristic 0..1

  await docRef.update({ relevanceScore: score });
  return score;
}
