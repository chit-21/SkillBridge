import { adminDb } from "@/lib/firebaseAdmin";
import fetch from "node-fetch";

const MATCHES_COLLECTION = "matches";

// Compute matches; prefer Python microservice, fallback to local scoring using Firestore data
export async function triggerMatch(userId: string, query?: string, intent?: "teaching" | "learning") {
  try {
    const ok = await ensureMicroservice();
    if (ok && query && intent) {
      // Convert intent to mode: "learning" -> "learn", "teaching" -> "teach"
      const mode = intent === "learning" ? "learn" : "teach";
      
      const response = await fetch("http://localhost:5000/compute-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, mode }),
      });
      if (response.ok) {
        const matchResults = await response.json();
        const savedMatches = [] as any[];
        for (const match of matchResults as { userId: string; score: number }[]) {
          const matchObj = await saveMatchResult({ userA: userId, userB: match.userId, score: match.score, status: "pending" });
          savedMatches.push(matchObj);
        }
        return savedMatches;
      }
    }
  } catch (_) {}

  const local = await computeLocalMatches(userId, query, intent);
  const savedMatches = [] as any[];
  for (const m of local) {
    const matchObj = await saveMatchResult({ userA: userId, userB: m.userB, score: m.score, status: "pending" });
    savedMatches.push(matchObj);
  }
  return savedMatches;
}

async function ensureMicroservice() {
  try {
    const res = await fetch("http://localhost:5000/health");
    if (res.ok) return true;
  } catch (_) {}
  try {
    await fetch("http://localhost:5000/start", { method: "POST" }).catch(() => {});
    await new Promise((r) => setTimeout(r, 800));
    const res2 = await fetch("http://localhost:5000/health").catch(() => ({ ok: false } as any));
    return !!(res2 as any).ok;
  } catch (_) {
    return false;
  }
}

function norm(s?: string) {
  return String(s || "").toLowerCase().trim();
}

function levenshtein(a: string, b: string) {
  const m = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) m[i][0] = i;
  for (let j = 0; j <= b.length; j++) m[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      m[i][j] = Math.min(m[i - 1][j] + 1, m[i][j - 1] + 1, m[i - 1][j - 1] + cost);
    }
  }
  return m[a.length][b.length];
}

function skillSimilarity(query: string, skill: string) {
  const q = norm(query);
  const s = norm(skill);
  if (!q || !s) return 0;
  if (q === s) return 1;
  if (s.includes(q) || q.includes(s)) return 0.8;
  const dist = levenshtein(q, s);
  const maxLen = Math.max(q.length, s.length);
  const ratio = 1 - dist / Math.max(1, maxLen);
  return Math.max(0, ratio * 0.7);
}

async function computeLocalMatches(userId: string, query?: string, intent?: "teaching" | "learning") {
  const meDoc = await adminDb.collection("users").doc(userId).get();
  if (!meDoc.exists) return [];
  const me = meDoc.data() as any;

  const snapshot = await adminDb.collection("users").get();
  const candidates = snapshot.docs.map((d) => d.data() as any).filter((u) => u.uid !== userId);

  const groups = [
    { name: "frontend", terms: ["frontend","html","css","javascript","js","react","vue","tailwind","sass","scss","ui","web"] },
    { name: "backend", terms: ["backend","api","node","express","nestjs","django","flask","go","java","spring","sql","database"] },
    { name: "data", terms: ["data","python","pandas","numpy","sql","ml","machine learning","data science","analytics"] },
    { name: "devops", terms: ["devops","docker","kubernetes","ci","cd","terraform","aws","gcp","azure"] },
    { name: "mobile", terms: ["mobile","android","ios","react native","flutter","swift","kotlin"] },
  ];

  function expand(term: string) {
    const t = norm(term);
    for (const g of groups) {
      if (g.terms.includes(t)) return g.terms;
    }
    return [t];
  }

  const results = candidates
    .map((c) => {
      let base = 0;
      if (query) {
        const targetSkills = intent === "teaching"
          ? (c.learningSkills || [])
          : intent === "learning"
          ? (c.teachingSkills || [])
          : [...(c.teachingSkills || []), ...(c.learningSkills || [])];

        const targetExpanded = targetSkills.flatMap((s: string) => expand(s));
        const queryExpanded = expand(query);
        const semanticHit = queryExpanded.some((q) => targetExpanded.includes(q));
        if (semanticHit) base = 4.5;
        const sim = Math.max(...targetExpanded.map((sk: string) => skillSimilarity(query, sk)), 0);
        base = Math.max(base, sim * 5);
      } else {
        const teachHit = (me.learningSkills || []).filter((x: string) => (c.teachingSkills || []).map(norm).includes(norm(x))).length;
        const learnHit = (me.teachingSkills || []).filter((x: string) => (c.learningSkills || []).map(norm).includes(norm(x))).length;
        base = teachHit * 3 + learnHit * 1;
      }
      const tzBonus = me.timezone && c.timezone && me.timezone === c.timezone ? 0.5 : 0;
      const score = base + tzBonus;
      return { userB: c.uid, score };
    })
    .filter((r) => r.score > 0.15)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  return results;
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
