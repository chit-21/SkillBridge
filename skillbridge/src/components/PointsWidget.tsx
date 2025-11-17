"use client";

import React from "react";
import { Card } from "./Card";

interface PointsWidgetProps {
  balance: number;
  isLoading?: boolean;
}

export function PointsWidget({ balance, isLoading }: PointsWidgetProps) {
  const formattedBalance = new Intl.NumberFormat("en-US").format(balance);

  return (
    <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-blue-700 dark:text-blue-300 text-sm font-medium mb-1">Your Points</p>
          {isLoading ? (
            <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          ) : (
            <h2 className="text-3xl font-semibold text-gray-900 dark:text-white">{formattedBalance}</h2>
          )}
          <p className="text-gray-600 dark:text-gray-400 text-xs mt-2">Earn more by teaching skills</p>
        </div>
        <div className="bg-blue-100 dark:bg-blue-900/50 rounded-full p-3">
          <svg
            className="w-6 h-6 text-blue-700 dark:text-blue-300"
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
        </div>
      </div>
    </Card>
  );
}


