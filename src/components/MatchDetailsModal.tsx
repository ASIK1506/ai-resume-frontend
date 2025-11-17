// filepath: src/components/MatchDetailsModal.tsx
import React from "react";
import type { MatchBreakdown } from "@/services/match";

const toPercent = (n?: number) => {
  if (n === undefined || n === null) return 0;
  return n <= 1 ? Math.round(n * 100) : Math.round(n);
};

type Props = {
  open: boolean;
  onClose: () => void;
  name: string;
  bestRoleTitle?: string | null;
  score?: number | null; // assume percent already
  breakdown?: MatchBreakdown | null; // can be 0..1 or 0..100
  details?: Record<string, number> | null;
};

export default function MatchDetailsModal({
  open,
  onClose,
  name,
  bestRoleTitle,
  score,
  breakdown,
}: Props) {
  if (!open) return null;

  const Row = ({ label, value }: { label: string; value?: number }) => (
    <div className="flex items-center justify-between text-sm">
      <span className="text-[var(--muted)]">{label}</span>
      <span className="font-semibold">{toPercent(value)}%</span>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-xl">
        <div className="mb-3 flex items-start justify-between">
          <div>
            <div className="text-lg font-semibold">{name}</div>
            <div className="text-xs text-[var(--muted)]">
              Best role: {bestRoleTitle || "—"}
            </div>
          </div>
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="mb-3">
          <div className="mb-1 text-xs text-[var(--muted)]">Match Score</div>
          <div className="h-2 w-full rounded bg-slate-200">
            <div
              className="h-2 rounded bg-blue-600"
              style={{ width: `${Math.round(score ?? 0)}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Row label="Skills" value={breakdown?.skills} />
          <Row label="Experience" value={breakdown?.experience} />
          <Row label="Education" value={breakdown?.education} />
          <Row label="Keywords" value={breakdown?.keywords} />
        </div>

        <div className="mt-4 text-xs text-[var(--muted)]">
          Tip: Satisfy all <b>must-have</b> skills to avoid penalties.
        </div>
      </div>
    </div>
  );
}
