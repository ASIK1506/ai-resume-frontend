// filepath: src/components/CandidateCard.tsx
import React, { useState } from "react";
import MatchDetailsModal from "./MatchDetailsModal";
import type { MatchBreakdown } from "@/services/match";

type Person = {
  id?: string | number;
  name?: string;
  role?: string;
  initials?: string;
  score?: number | null;
  years?: number | null;
  updated?: string;
  badge?: string;
  tags?: string[];
  education?: number | null;
  raw_text?: string | null;
  bestRoleTitle?: string | null;
  breakdown?: MatchBreakdown | null;
  details?: Record<string, number> | null;
};

type Props =
  | { person: Person; candidate?: never }
  | { candidate: Person; person?: never }
  | { person?: Person; candidate?: Person };

export default function CandidateCard(props: Props) {
  const p: Person = (props as any).person || (props as any).candidate || {};
  const [show, setShow] = useState(false);

  const name = p.name || "Candidate";
  const initials =
    p.initials ||
    name
      .split(" ")
      .filter(Boolean)
      .map((s) => s[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  const years = Number.isFinite(p.years as number) ? (p.years as number) : 0;
  const score = typeof p.score === "number" ? Math.round(p.score as number) : null;
  const tags = Array.isArray(p.tags) ? p.tags : [];

  return (
    <>
      <div className="card p-4 flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center font-semibold">
              {initials}
            </div>
            <div>
              <div className="font-semibold">{name}</div>
              <div className="text-xs text-[var(--muted)]">
                {years} years • {p.role || "—"}
              </div>
            </div>
          </div>

          {score !== null && (
            <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold bg-blue-600 text-white">
              {score}% match
            </span>
          )}
        </div>

        {score !== null && (
          <div className="mt-1">
            <div className="h-2 w-full rounded bg-slate-200">
              <div className="h-2 rounded bg-blue-600" style={{ width: `${score}%` }} />
            </div>
            <div className="mt-1 text-xs text-[var(--muted)]">
              {p.bestRoleTitle ? (
                <>
                  Best role: <span className="font-medium">{p.bestRoleTitle}</span>
                </>
              ) : (
                "—"
              )}
            </div>
          </div>
        )}

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 6).map((t) => (
              <span
                key={t}
                className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700"
              >
                {t}
              </span>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <button className="btn-secondary" onClick={() => setShow(true)}>
            View Details
          </button>
          <button className="btn">Schedule Interview</button>
        </div>
      </div>

      <MatchDetailsModal
        open={show}
        onClose={() => setShow(false)}
        name={name}
        bestRoleTitle={p.bestRoleTitle}
        score={score ?? 0}
        breakdown={p.breakdown}
        details={p.details}
      />
    </>
  );
}
