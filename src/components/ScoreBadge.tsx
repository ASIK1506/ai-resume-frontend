// src/components/ScoreBadge.tsx
import React from "react";

export default function ScoreBadge({ score }: { score?: number | null }) {
  if (score === undefined || score === null) return null;
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold bg-blue-600 text-white"
      title="Match score"
    >
      {Math.round(score)}% match
    </span>
  );
}
