// src/hooks/useCandidateMatch.ts
import { useEffect, useMemo, useState } from "react";
import { ResumeIn, scoreAgainstAllJobs, RoleMatchItem, Weights } from "../services/match";

export type CandidateLike = {
  id: string | number;
  name?: string;
  skills?: string[];
  years_experience?: number | null;
  years?: number | null;
  education?: number | null;
  resumeText?: string | null;
  raw_text?: string | null;
  current_title?: string | null;
};

function toResume(c: CandidateLike | undefined, fallback?: ResumeIn): ResumeIn {
  if (fallback) return fallback;
  const years =
    (c?.years_experience ?? c?.years ?? 0) || 0;
  const education = c?.education ?? 0;
  const raw = (c?.raw_text ?? c?.resumeText) || "";
  const skills = c?.skills ?? [];
  return { skills, years_experience: Number(years), education: Number(education), raw_text: raw };
}

export function useCandidateMatch(
  candidate?: CandidateLike,
  explicitResume?: ResumeIn,
  weights?: Weights
) {
  const resume = useMemo(() => toResume(candidate, explicitResume), [candidate, explicitResume]);
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<RoleMatchItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    scoreAgainstAllJobs(resume, weights)
      .then((r) => {
        if (!mounted) return;
        setRoles(r);
        setError(null);
      })
      .catch((e) => {
        if (!mounted) return;
        setError(e?.message || "match failed");
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [resume.skills.join(","), resume.years_experience, resume.education, resume.raw_text, weights?.skills, weights?.experience, weights?.education, weights?.keywords]);

  const best = roles?.[0];
  return { loading, error, roles, best, resume };
}
