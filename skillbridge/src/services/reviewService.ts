import { adminDb } from "@/lib/firebaseAdmin";

const REVIEWS_COLLECTION = "reviews";

export async function addReview({
  sessionId,
  fromUser,
  toUser,
  rating,
  comments,
}: {
  sessionId: string;
  fromUser: string;
  toUser: string;
  rating: number;
  comments?: string;
}) {
  const reviewRef = adminDb.collection(REVIEWS_COLLECTION).doc();
  const reviewData = {
    reviewId: reviewRef.id,
    sessionId,
    fromUser,
    toUser,
    rating,
    comments: comments || "",
    createdAt: new Date().toISOString(),
  };

  await reviewRef.set(reviewData);
  return reviewData;
}

export async function getReviewsByUser(userId: string) {
  const snapshot = await adminDb
    .collection(REVIEWS_COLLECTION)
    .where("toUser", "==", userId)
    .orderBy("createdAt", "desc")
    .get();

  const reviews: any[] = [];
  snapshot.forEach((doc) => reviews.push(doc.data()));
  return reviews;
}
