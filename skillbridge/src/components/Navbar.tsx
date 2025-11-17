"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";

interface NavbarProps {
  pointsBalance?: number;
}

export function Navbar({ pointsBalance }: NavbarProps) {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const linkClass = (href: string) => ((pathname === href ? "text-blue-700 dark:text-blue-400 font-medium" : "text-gray-700 dark:text-gray-300") + " hover:text-blue-600 dark:hover:text-blue-400 transition-colors");

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="text-xl font-semibold text-gray-900 dark:text-white hover:text-blue-700 dark:hover:text-blue-400 transition-colors">
              SkillBridge
            </Link>
            <div className="hidden md:flex items-center gap-6">
              <Link href="/dashboard" className={linkClass("/dashboard")}>Dashboard</Link>
              <Link href="/match" className={linkClass("/match")}>Matches</Link>
              <Link href="/sessions" className={linkClass("/sessions")}>Sessions</Link>
              <Link href="/profile" className={linkClass("/profile")}>Profile</Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {pointsBalance !== undefined && (
              <div className="hidden sm:flex items-center gap-2 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-md">
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941a1 1 0 102 0v-.941a4.535 4.535 0 001.676-.662C13.398 9.766 14 8.991 14 8c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 5.092V4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="font-medium text-sm">{pointsBalance.toLocaleString()}</span>
              </div>
            )}
            {user && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-700 dark:text-gray-300 hidden sm:block">
                  {user.email}
                </span>
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}


