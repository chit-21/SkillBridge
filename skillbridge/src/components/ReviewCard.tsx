"use client";

import React from "react";
import { Card } from "./Card";

interface ReviewCardProps {
  review: {
    rating: number;
    comments?: string;
    fromUser?: string;
    createdAt: string;
  };
  reviewerName?: string;
}

export function ReviewCard({ review, reviewerName }: ReviewCardProps) {
  const date = new Date(review.createdAt);
  const formattedDate = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <svg
        key={i}
        className={`w-4 h-4 ${
          i < rating
            ? "text-yellow-400 fill-current"
            : "text-gray-300 dark:text-gray-600"
        }`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ));
  };

  return (
    <Card hover className="mb-4">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center gap-1">{renderStars(review.rating)}</div>
            <span className="text-sm text-gray-500 dark:text-gray-400">{formattedDate}</span>
          </div>
          {reviewerName && (
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {reviewerName}
            </p>
          )}
          {review.comments && (
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {review.comments}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}


