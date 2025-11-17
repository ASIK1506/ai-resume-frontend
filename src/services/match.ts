// filepath: src/services/match.ts
import { apiBase } from "./env";

export type Weights = { skills?: number; experience?: number; education?: number; keywords?: number; };
export type ResumeIn = { skills: string[]; years_experience: number; education: number; raw_text?: string | null; };
export type MatchBreakdown = { skills: number; experience: number; education: number; keywords: number; };
export type MatchResponse = { score: number; breakdown: MatchBreakdown; details: Record<string, number>; };
export type JobRequirements = {
  id?: string; title: string; description?: string;
  min_years_experience: number; required_education: number;
  must_have_skills: string[]; nice_to_have_skills: string[];
};
export type RoleMatchItem = { job_id: string; title: string; score: number; breakdown: MatchBreakdown; details: Record<string, number>; };
export type BatchItem = { skills: string[]; years_experience: number; education: number; raw_text?: string | null; };

const BASE = apiBase();

async function postJson<T>(path: string, body: unknown, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
  const url = new URL(`${BASE}${path}`);
  if (params) Object.entries(params).forEach(([k, v]) => (v !== undefined && v !== null) && url.searchParams.set(k, String(v)));
  const res = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  if (!res.ok) {
    const text = await res.text();
    console.error(`[MATCH API ${path}] HTTP ${res.status}`, text);
    throw new Error(text || `HTTP ${res.status}`);
  }
  return (await res.json()) as T;
}

// Normalize 0..1 or 0..100 to 0..100
export function toPercent(n: unknown): number {
  const x = Number(n);
  if (!isFinite(x)) return 0;
  return x <= 1 ? Math.round(x * 100) : Math.round(x);
}

export const MatchAPI = {
  scoreOne: (resume: ResumeIn, job: JobRequirements, weights?: Weights) =>
    postJson<MatchResponse>("/api/v1/match/score", { resume, job, weights }),
  scoreBatch: (payload: { resumes: BatchItem[]; job: JobRequirements; weights?: Weights }) =>
    postJson<Array<{ score: number; breakdown: MatchBreakdown; details: Record<string, number> }>>("/api/v1/match/score/batch", payload),
  scoreAgainstAllJobs: (resume: ResumeIn, weights?: Weights) =>
    postJson<RoleMatchItem[]>("/api/v1/match/score/roles", { resume, weights }),
};

export default MatchAPI;
