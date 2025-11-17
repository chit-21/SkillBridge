"use client";

import React from "react";
import { Card } from "./Card";

interface SessionCardProps {
  session: {
    sessionId: string;
    scheduledAt: string;
    status: string;
    roomId?: string;
    matchId?: string;
  };
  partnerName?: string;
  skill?: string;
}

export function SessionCard({ session, partnerName, skill }: SessionCardProps) {
  const date = new Date(session.scheduledAt);
  const formattedDate = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const formattedTime = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  const statusColors = {
    scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  };

  return (
    <Card hover className="mb-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                statusColors[session.status as keyof typeof statusColors] || statusColors.scheduled
              }`}
            >
              {session.status}
            </span>
          </div>
          <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
            {partnerName || "Learning Session"}
          </h4>
          {skill && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Skill: {skill}</p>
          )}
          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <svg
                className="w-4 h-4"
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
              {formattedDate}
            </div>
            <div className="flex items-center gap-1">
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {formattedTime}
            </div>
          </div>
        </div>
        {session.status === "scheduled" && (
          <button className="ml-4 px-4 py-2 bg-blue-700 text-white rounded-md hover:bg-blue-800 transition-colors text-sm font-medium">
            Join
          </button>
        )}
      </div>
    </Card>
  );
}


