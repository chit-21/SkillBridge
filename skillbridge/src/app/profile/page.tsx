// skillbridge/src/app/profile/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/apiClient";
import { Navbar } from "@/components/Navbar";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ErrorMessage } from "@/components/ErrorMessage";
import { ProfileCard } from "@/components/ProfileCard";

type ProfileData = {
  uid: string;
  name: string;
  email: string;
  timezone: string;
  profile?: Record<string, any>;
  teachingSkills: string[];
  learningSkills: string[];
};

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiClient.get<ProfileData>("/api/profile");
        setProfile(data);
      } catch (err: any) {
        setError(err.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  const save = async (updates: Partial<ProfileData>) => {
    try {
      const data = await apiClient.put<ProfileData>("/api/profile", updates);
      setProfile(data as any);
    } catch (err: any) {
      setError(err.message || "Failed to update profile");
    }
  };

  const addSkill = async (type: "teaching" | "learning", skill: string) => {
    try {
      const data = await apiClient.post<ProfileData>("/api/profile", { type, skill });
      setProfile(data as any);
    } catch (err: any) {
      setError(err.message || "Failed to add skill");
    }
  };

 const removeSkill = async (type: "teaching" | "learning", skill: string) => {
  try {
    const params = new URLSearchParams({ type, skill }).toString();
    const data = await apiClient.delete<ProfileData>(`/api/profile?${params}`);
    setProfile(data as any);
  } catch (err: any) {
    setError(err.message || "Failed to remove skill");
  }
};

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  if (!profile) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6">
            <ErrorMessage message={error} onRetry={() => window.location.reload()} />
          </div>
        )}
        <ProfileCard
          profile={profile}
          onSave={save}
          onAddSkill={addSkill}
          onRemoveSkill={removeSkill}
        />
      </main>
    </div>
  );
}