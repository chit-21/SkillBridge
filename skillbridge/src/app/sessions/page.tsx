"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/apiClient";
import { Navbar } from "@/components/Navbar";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ErrorMessage } from "@/components/ErrorMessage";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";

interface Session {
  sessionId: string;
  matchId: string;
  scheduledAt: string;
  status: string;
  roomId?: string;
  createdAt: string;
  completedAt?: string;
  transcriptRef?: string;
}

export default function SessionsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "scheduled" | "completed">("all");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    fetchSessions();
  }, [user]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.get<Session[]>("/api/sessions");
      setSessions(data);
    } catch (err: any) {
      setError(err.message || "Failed to load sessions");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinSession = (sessionId: string, roomId: string) => {
    router.push(`/room/${roomId}`);
  };

  const handleCompleteSession = async (sessionId: string) => {
    try {
      await apiClient.post(`/api/session/complete`, { sessionId, transcriptRef: `transcript-${sessionId}` });
      fetchSessions();
    } catch (err: any) {
      setError(err.message || "Failed to complete session");
    }
  };

  const filteredSessions = sessions.filter((session) => {
    if (filter === "all") return true;
    if (filter === "scheduled") return session.status === "scheduled";
    if (filter === "completed") return session.status === "completed";
    return true;
  });

  const upcomingSessions = filteredSessions.filter(
    (s) => s.status === "scheduled" && new Date(s.scheduledAt) > new Date()
  );

  const pastSessions = filteredSessions.filter(
    (s) => s.status === "completed" || (s.status === "scheduled" && new Date(s.scheduledAt) <= new Date())
  );

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            My Sessions
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Manage your learning and teaching sessions
          </p>
        </div>

        {error && (
          <div className="mb-6">
            <ErrorMessage message={error} onRetry={fetchSessions} />
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex space-x-2 mb-6 border-b border-gray-200 dark:border-gray-800">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              filter === "all"
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            }`}
          >
            All Sessions ({sessions.length})
          </button>
          <button
            onClick={() => setFilter("scheduled")}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              filter === "scheduled"
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            }`}
          >
            Scheduled ({upcomingSessions.length})
          </button>
          <button
            onClick={() => setFilter("completed")}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              filter === "completed"
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            }`}
          >
            Completed ({sessions.filter((s) => s.status === "completed").length})
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <>
            {/* Upcoming Sessions */}
            {upcomingSessions.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Upcoming Sessions
                </h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {upcomingSessions.map((session) => {
                    const scheduledDate = new Date(session.scheduledAt);
                    const isToday = scheduledDate.toDateString() === new Date().toDateString();
                    const isSoon = (scheduledDate.getTime() - Date.now()) < 3600000; // Less than 1 hour

                    return (
                      <Card key={session.sessionId} className={`${isSoon ? "border-2 border-green-500" : ""}`}>
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <div className="flex items-center space-x-2 mb-2">
                              {isSoon && (
                                <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-medium rounded">
                                  Starting Soon
                                </span>
                              )}
                              {isToday && !isSoon && (
                                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium rounded">
                                  Today
                                </span>
                              )}
                            </div>
                            <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                              Session #{session.sessionId.slice(0, 8)}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {scheduledDate.toLocaleString()}
                            </p>
                          </div>
                          <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 text-sm font-medium rounded-full">
                            {session.status}
                          </span>
                        </div>

                        <div className="space-y-2 mb-4">
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Scheduled for {scheduledDate.toLocaleDateString()}
                          </div>
                          {session.roomId && (
                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                              Room: {session.roomId}
                            </div>
                          )}
                        </div>

                        <div className="flex space-x-2">
                          {session.roomId && (
                            <Button
                              onClick={() => handleJoinSession(session.sessionId, session.roomId!)}
                              variant="primary"
                              className="flex-1"
                            >
                              Join Session
                            </Button>
                          )}
                          <Button
                            onClick={() => handleCompleteSession(session.sessionId)}
                            variant="outline"
                          >
                            Complete
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Past Sessions */}
            {pastSessions.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Past Sessions
                </h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {pastSessions.map((session) => (
                    <Card key={session.sessionId} className="opacity-75">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            Session #{session.sessionId.slice(0, 8)}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {new Date(session.scheduledAt).toLocaleString()}
                          </p>
                        </div>
                        <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-full">
                          {session.status}
                        </span>
                      </div>

                      {session.completedAt && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                          Completed on {new Date(session.completedAt).toLocaleDateString()}
                        </p>
                      )}

                      {session.transcriptRef && (
                        <Button
                          onClick={() => router.push(`/transcripts/${session.transcriptRef}`)}
                          variant="outline"
                          className="w-full"
                        >
                          View Transcript
                        </Button>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {filteredSessions.length === 0 && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📅</div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No sessions found
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Find matches and schedule your first learning session!
                </p>
                <Button onClick={() => router.push("/matches")} variant="primary">
                  Find Matches
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
