import { adminDb } from "@/lib/firebaseAdmin";

const POINTS_COLLECTION = "points";

export async function getPoints(userId: string) {
  const doc = await adminDb.collection(POINTS_COLLECTION).doc(userId).get();

  if (!doc.exists) {
    // initialize
    const initial = { userId, balance: 0, transactions: [] };
    await adminDb.collection(POINTS_COLLECTION).doc(userId).set(initial);
    return initial;
  }

  return doc.data();
}

export async function adjustPoints(userId: string, amount: number, reason: string, actor?: string) {
  const docRef = adminDb.collection(POINTS_COLLECTION).doc(userId);
  const doc = await docRef.get();

  let data: any;
  if (!doc.exists) {
    data = { userId, balance: 0, transactions: [] };
  } else {
    data = doc.data();
  }

  const newBalance = (data.balance || 0) + amount;
  const txn = {
    type: amount >= 0 ? "credit" : "debit",
    amount: Math.abs(amount),
    reason,
    actor: actor || null,
    timestamp: new Date().toISOString(),
  };

  data.balance = newBalance;
  data.transactions = data.transactions || [];
  data.transactions.unshift(txn); // keep newest first

  await docRef.set(data, { merge: true });
  return data;
}
