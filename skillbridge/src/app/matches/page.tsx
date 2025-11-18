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

interface Match {
  matchId: string;
  userA: string;
  userB: string;
  score: number;
  status: string;
  createdAt: string;
}

interface UserProfile {
  uid: string;
  name: string;
  email: string;
  teachingSkills: string[];
  learningSkills: string[];
  timezone: string;
  points?: number;
}

export default function MatchesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [userProfiles, setUserProfiles] = useState<Record<string, UserProfile>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [intent, setIntent] = useState<"learning" | "teaching" | "">("");
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const handleSearch = async () => {
    if (!user) return;
    
    try {
      setSearching(true);
      setError(null);
      
      const body: any = { userId: user.uid };
      if (searchQuery.trim()) body.query = searchQuery.trim();
      if (intent) body.intent = intent;

      const response = await apiClient.post<Match[]>("/api/match/trigger", body);
      setMatches(response);

      // Fetch user profiles for matched users
      const userIds = new Set<string>();
      response.forEach((match) => {
        if (match.userB !== user.uid) userIds.add(match.userB);
      });

      const profiles: Record<string, UserProfile> = {};
      for (const userId of Array.from(userIds)) {
        try {
          const profile = await apiClient.get<UserProfile>(`/api/users/${userId}`);
          profiles[userId] = profile;
        } catch (err) {
          console.error(`Failed to fetch profile for ${userId}`);
        }
      }
      setUserProfiles(profiles);
    } catch (err: any) {
      setError(err.message || "Failed to find matches");
    } finally {
      setSearching(false);
    }
  };

  const handleScheduleSession = async (matchId: string) => {
    try {
      // Navigate to session scheduling page
      router.push(`/sessions/schedule?matchId=${matchId}`);
    } catch (err: any) {
      setError(err.message || "Failed to schedule session");
    }
  };

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
            Find Your Match
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Discover learners and teachers who match your skills and interests
          </p>
        </div>

        {/* Search Section */}
        <Card className="mb-8">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                What do you want to learn or teach?
              </label>
              <input
                type="text"
                placeholder="e.g., React, Python, Data Science, Guitar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                I want to...
              </label>
              <div className="flex gap-4">
                <button
                  onClick={() => setIntent(intent === "learning" ? "" : "learning")}
                  className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                    intent === "learning"
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                      : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                  }`}
                >
                  <div className="text-2xl mb-1">📚</div>
                  <div className="font-medium">Learn</div>
                </button>
                <button
                  onClick={() => setIntent(intent === "teaching" ? "" : "teaching")}
                  className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                    intent === "teaching"
                      ? "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
                      : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                  }`}
                >
                  <div className="text-2xl mb-1">🎓</div>
                  <div className="font-medium">Teach</div>
                </button>
              </div>
            </div>

            <Button
              onClick={handleSearch}
              isLoading={searching}
              variant="primary"
              size="lg"
              className="w-full"
            >
              {searching ? "Searching..." : "Find Matches"}
            </Button>
          </div>
        </Card>

        {error && (
          <div className="mb-6">
            <ErrorMessage message={error} />
          </div>
        )}

        {/* Results */}
        {matches.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Your Matches ({matches.length})
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {matches.map((match) => {
                const otherUserId = match.userB;
                const profile = userProfiles[otherUserId];
                
                if (!profile) return null;

                return (
                  <Card key={match.matchId} className="hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-lg">
                            {profile.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {profile.name}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {profile.timezone}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="text-yellow-500">⭐</span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {match.score.toFixed(1)}
                        </span>
                      </div>
                    </div>

                    {/* Teaching Skills */}
                    {profile.teachingSkills.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Can teach:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {profile.teachingSkills.slice(0, 3).map((skill, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded text-xs"
                            >
                              {skill}
                            </span>
                          ))}
                          {profile.teachingSkills.length > 3 && (
                            <span className="px-2 py-1 text-gray-500 text-xs">
                              +{profile.teachingSkills.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Learning Skills */}
                    {profile.learningSkills.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Wants to learn:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {profile.learningSkills.slice(0, 3).map((skill, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs"
                            >
                              {skill}
                            </span>
                          ))}
                          {profile.learningSkills.length > 3 && (
                            <span className="px-2 py-1 text-gray-500 text-xs">
                              +{profile.learningSkills.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <Button
                      onClick={() => handleScheduleSession(match.matchId)}
                      variant="primary"
                      className="w-full"
                    >
                      Schedule Session
                    </Button>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {matches.length === 0 && !searching && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No matches yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Search for skills or interests to find your perfect match!
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
