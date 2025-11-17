"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/apiClient";
import { Navbar } from "@/components/Navbar";
import { PointsWidget } from "@/components/PointsWidget";
import { SessionCard } from "@/components/SessionCard";
import { ReviewCard } from "@/components/ReviewCard";
import { Card, CardHeader } from "@/components/Card";
import { Button } from "@/components/Button";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ErrorMessage } from "@/components/ErrorMessage";
import Link from "next/link";

interface PointsData {
  balance: number;
  userId: string;
  transactions?: any[];
}

interface Session {
  id: string;
  sessionId: string;
  matchId: string;
  scheduledAt: string;
  status: string;
  roomId?: string;
}

interface Review {
  reviewId: string;
  rating: number;
  comments?: string;
  fromUser: string;
  createdAt: string;
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [points, setPoints] = useState<PointsData | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [matching, setMatching] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Fetch dashboard data
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all data in parallel
        const [pointsData, sessionsData, reviewsData] = await Promise.all([
          apiClient.get<PointsData>("/api/points/me").catch(() => ({ balance: 0, userId: user.uid })),
          apiClient.get<Session[]>("/api/sessions").catch(() => []),
          apiClient.get<Review[]>(`/api/reviews/user/${user.uid}`).catch(() => []),
        ]);

        setPoints(pointsData);
        setSessions(sessionsData);
        setReviews(reviewsData.slice(0, 5)); // Show only recent 5 reviews
      } catch (err: any) {
        setError(err.message || "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleFindMatches = async () => {
    try {
      setMatching(true);
      setError(null);
      const matches = await apiClient.post("/api/match/trigger");
      // Redirect to match page
      router.push("/match");
    } catch (err: any) {
      setError(err.message || "Failed to find matches");
    } finally {
      setMatching(false);
    }
  };

  // Filter upcoming sessions
  const upcomingSessions = sessions
    .filter((s) => s.status === "scheduled")
    .filter((s) => new Date(s.scheduledAt) > new Date())
    .slice(0, 3);

  // Calculate average rating
  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar pointsBalance={points?.balance} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-2">
            Welcome back{user.displayName ? `, ${user.displayName}` : ""}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Here's what's happening with your learning journey
          </p>
        </div>

        {error && (
          <div className="mb-6">
            <ErrorMessage message={error} onRetry={() => window.location.reload()} />
          </div>
        )}

        {/* Points Widget */}
        <div className="mb-8">
          <PointsWidget balance={points?.balance || 0} isLoading={loading} />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Upcoming Sessions */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader
                title="Upcoming Sessions"
                subtitle={`${upcomingSessions.length} session${upcomingSessions.length !== 1 ? "s" : ""} scheduled`}
                action={
                  <Link
                    href="/sessions"
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    View All
                  </Link>
                }
              />
              {loading ? (
                <LoadingSpinner />
              ) : upcomingSessions.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="mt-2">No upcoming sessions</p>
                  <p className="text-sm">Schedule a session to get started!</p>
                </div>
              ) : (
                <div>
                  {upcomingSessions.map((session) => (
                    <SessionCard key={session.id} session={session} />
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Recent Reviews */}
          <div>
            <Card>
              <CardHeader
                title="Recent Reviews"
                subtitle={
                  reviews.length > 0
                    ? `Avg: ${averageRating.toFixed(1)} ⭐`
                    : "No reviews yet"
                }
                action={
                  <Link
                    href="/reviews"
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    View All
                  </Link>
                }
              />
              {loading ? (
                <LoadingSpinner />
              ) : reviews.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                    />
                  </svg>
                  <p className="mt-2">No reviews yet</p>
                  <p className="text-sm">Complete sessions to get reviews!</p>
                </div>
              ) : (
                <div>
                  {reviews.map((review) => (
                    <ReviewCard key={review.reviewId} review={review} />
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* Find Matches Section */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Ready to Learn or Teach?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Find your perfect match and start your learning journey today!
              </p>
            </div>
            <Button
              onClick={handleFindMatches}
              isLoading={matching}
              size="lg"
              className="whitespace-nowrap"
            >
              {matching ? "Finding Matches..." : "Find Matches"}
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
}

