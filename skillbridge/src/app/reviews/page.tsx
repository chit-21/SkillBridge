"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/apiClient";
import { Navbar } from "@/components/Navbar";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ErrorMessage } from "@/components/ErrorMessage";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";

interface Review {
  reviewId: string;
  sessionId: string;
  fromUser: string;
  toUser: string;
  rating: number;
  comments: string;
  createdAt: string;
}

interface ReviewWithUser extends Review {
  fromUserName?: string;
}

export default function ReviewsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [reviews, setReviews] = useState<ReviewWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddReview, setShowAddReview] = useState(false);
  const [newReview, setNewReview] = useState({
    sessionId: "",
    toUserId: "",
    rating: 5,
    comments: "",
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    fetchReviews();
  }, [user]);

  const fetchReviews = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.get<Review[]>(`/api/reviews/user/${user.uid}`);
      setReviews(data);
    } catch (err: any) {
      setError(err.message || "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      await apiClient.post("/api/reviews", {
        sessionId: newReview.sessionId,
        fromUser: user.uid,
        toUser: newReview.toUserId,
        rating: newReview.rating,
        comments: newReview.comments,
      });

      setShowAddReview(false);
      setNewReview({ sessionId: "", toUserId: "", rating: 5, comments: "" });
      fetchReviews();
    } catch (err: any) {
      setError(err.message || "Failed to submit review");
    }
  };

  const calculateAverageRating = () => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / reviews.length).toFixed(1);
  };

  const getRatingDistribution = () => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((review) => {
      distribution[review.rating as keyof typeof distribution]++;
    });
    return distribution;
  };

  const renderStars = (rating: number, interactive = false, onRate?: (rating: number) => void) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => interactive && onRate && onRate(star)}
            className={`${interactive ? "cursor-pointer hover:scale-110" : "cursor-default"} transition-transform`}
            disabled={!interactive}
          >
            <svg
              className={`w-6 h-6 ${
                star <= rating ? "text-yellow-500 fill-current" : "text-gray-300 dark:text-gray-600"
              }`}
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        ))}
      </div>
    );
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const avgRating = calculateAverageRating();
  const distribution = getRatingDistribution();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Reviews
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              See what others are saying about you
            </p>
          </div>
          <Button onClick={() => setShowAddReview(true)} variant="primary">
            Leave a Review
          </Button>
        </div>

        {error && (
          <div className="mb-6">
            <ErrorMessage message={error} onRetry={fetchReviews} />
          </div>
        )}

        {/* Add Review Modal */}
        {showAddReview && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-md w-full">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Leave a Review
              </h2>
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Session ID
                  </label>
                  <input
                    type="text"
                    required
                    value={newReview.sessionId}
                    onChange={(e) => setNewReview({ ...newReview, sessionId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="Enter session ID"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    User ID (who you're reviewing)
                  </label>
                  <input
                    type="text"
                    required
                    value={newReview.toUserId}
                    onChange={(e) => setNewReview({ ...newReview, toUserId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="Enter user ID"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Rating
                  </label>
                  {renderStars(newReview.rating, true, (rating) =>
                    setNewReview({ ...newReview, rating })
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Comments (optional)
                  </label>
                  <textarea
                    value={newReview.comments}
                    onChange={(e) => setNewReview({ ...newReview, comments: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="Share your experience..."
                  />
                </div>

                <div className="flex space-x-3">
                  <Button type="submit" variant="primary" className="flex-1">
                    Submit Review
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddReview(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Stats Sidebar */}
            <div className="lg:col-span-1">
              <Card>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Rating Overview
                </h2>

                <div className="text-center mb-6">
                  <div className="text-5xl font-bold text-gray-900 dark:text-white mb-2">
                    {avgRating}
                  </div>
                  <div className="flex justify-center mb-2">
                    {renderStars(Math.round(parseFloat(avgRating)))}
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Based on {reviews.length} review{reviews.length !== 1 ? "s" : ""}
                  </p>
                </div>

                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map((rating) => {
                    const count = distribution[rating as keyof typeof distribution];
                    const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;

                    return (
                      <div key={rating} className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400 w-6">
                          {rating}★
                        </span>
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-yellow-500 h-2 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-400 w-8 text-right">
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>

            {/* Reviews List */}
            <div className="lg:col-span-2">
              {reviews.length === 0 ? (
                <Card>
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">⭐</div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      No reviews yet
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Complete sessions to receive reviews from your peers
                    </p>
                  </div>
                </Card>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <Card key={review.reviewId}>
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold">
                              {review.fromUserName?.charAt(0).toUpperCase() || "?"}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {review.fromUserName || "Anonymous"}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        {renderStars(review.rating)}
                      </div>

                      {review.comments && (
                        <p className="text-gray-700 dark:text-gray-300 mt-3">
                          {review.comments}
                        </p>
                      )}

                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Session: {review.sessionId.slice(0, 8)}...
                        </p>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
