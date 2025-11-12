import { adminDb } from "@/lib/firebaseAdmin";
import fetch from "node-fetch";

const MATCHES_COLLECTION = "matches";

// Call Python microservice to compute matches
export async function triggerMatch(userId: string) {
  try {
    const response = await fetch("http://localhost:5000/compute-match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      throw new Error(`Python microservice error: ${response.statusText}`);
    }

    const matchResults = await response.json(); // Expect array of { userB, score }
    const savedMatches = [];

    for (const match of matchResults) {
      const matchObj = await saveMatchResult({
        userA: userId,
        userB: match.userB,
        score: match.score,
        status: "pending",
      });
      savedMatches.push(matchObj);
    }

    return savedMatches;
  } catch (err) {
    throw new Error(`triggerMatch failed: ${(err as Error).message}`);
  }
}

// Save match result in Firestore
export async function saveMatchResult({
  userA,
  userB,
  score,
  status,
}: {
  userA: string;
  userB: string;
  score: number;
  status: "pending" | "completed" | "cancelled";
}) {
  const matchRef = adminDb.collection(MATCHES_COLLECTION).doc();
  const matchData = {
    matchId: matchRef.id,
    userA,
    userB,
    score,
    status,
    createdAt: new Date().toISOString(),
  };

  await matchRef.set(matchData);
  return matchData;
}
