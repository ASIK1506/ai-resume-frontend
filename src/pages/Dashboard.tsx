// filepath: src/pages/Dashboard.tsx
import React, { useEffect, useMemo, useState } from "react";
import CandidateCard from "@/components/CandidateCard";
import UploadModal from "@/components/UploadModal";
import ResumeUpload from "@/components/ResumeUpload";
import QuestionsPanel from "@/components/QuestionsPanel";
import { JobsAPI, ResumesAPI } from "@/services/http"; // keep your existing http.ts
import type { JobRequirements, ResumeRecord } from "@/services/http";
import MatchAPI, { toPercent } from "@/services/match";
import { apiBase } from "@/services/env";
import CreateRoleModal from "@/components/CreateRoleModal";

// --- PROFESSIONAL THEME CONSTANTS ---
const PRIMARY_ACCENT = "#007B80"; // Deep Teal
const HOVER_ACCENT = "#008C99";
const ACTIVE_SIDEBAR_BG = "#E6F4F5";
const MAIN_BG = "bg-gray-50"; // Subtle off-white background

type Person = {
  id: string;
  name: string;
  role: string;
  initials: string;
  score: number; // always 0..100 in UI
  years: number;
  updated: string;
  badge: string;
  tags: string[];
  education: number;
  raw_text: string;
  bestRoleTitle?: string | null;
  breakdown?: import("@/services/match").MatchBreakdown | null;
  details?: Record<string, number> | null;
};

const initials = (n?: string) =>
  (n || "??")
    .split(" ")
    .filter(Boolean)
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

type SortKey = "score_desc" | "exp_desc" | "exp_asc";

export default function Dashboard() {
  const [openUpload, setOpenUpload] = useState(false);
  const [openCreateRole, setOpenCreateRole] = useState(false); // NEW
  const [jobs, setJobs] = useState<JobRequirements[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobRequirements | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("score_desc");
  const [matchErr, setMatchErr] = useState<string | null>(null);

  const mapResumes = (rows: ResumeRecord[]): Person[] =>
    rows.map((r) => ({
      id: r.id,
      name: r.name || "Candidate",
      role: "—",
      initials: initials(r.name),
      score: 0,
      years: Number(r.years_experience || 0),
      updated: new Date(r.updated_at || r.created_at || Date.now()).toDateString(),
      badge: "New",
      tags: Array.isArray(r.skills) ? r.skills : [],
      education: Number(r.education ?? 0),
      raw_text: String(r.raw_text || ""),
    }));

  // initial load
  useEffect(() => {
    (async () => {
      try {
        const list = await JobsAPI.list<JobRequirements[]>();
        setJobs(list);
        setSelectedJob(null); // "All Roles (best match)"
      } catch (e: any) {
        console.error("Jobs load failed", e);
        setJobs([]);
        setSelectedJob(null);
      }
    })();
    (async () => {
      try {
        const list = await ResumesAPI.list<ResumeRecord[]>();
        const byId = new Map<string, ResumeRecord>();
        list.forEach((r) => byId.set(r.id, r));
        setPeople(mapResumes(Array.from(byId.values())));
      } catch (e: any) {
        console.error("Resumes load failed", e);
        setPeople([]);
      }
    })();
  }, []);

  // live refresh on resumes:changed
  useEffect(() => {
    const h = () => {
      (async () => {
        try {
          const list = await ResumesAPI.list<ResumeRecord[]>();
          const byId = new Map<string, ResumeRecord>();
          list.forEach((r) => byId.set(r.id, r));
          setPeople(mapResumes(Array.from(byId.values())));
        } catch (e: any) {
          console.error("Resumes refresh failed", e);
          setPeople([]);
        }
      })();
    };
    window.addEventListener("resumes:changed", h as EventListener);
    return () => window.removeEventListener("resumes:changed", h as EventListener);
  }, []);

  // payload for /match
  const resumesForAPI = useMemo(
    () =>
      people.map((p) => ({
        skills: p.tags,
        years_experience: p.years,
        education: p.education,
        raw_text: p.raw_text,
      })),
    [people]
  );

  // compute scores — selected role (batch) or best role fallback
  useEffect(() => {
    (async () => {
      if (people.length === 0) return;
      setMatchErr(null);

      if (selectedJob?.id) {
        try {
          const results = await MatchAPI.scoreBatch({ resumes: resumesForAPI, job: selectedJob });
          setPeople((prev) =>
            prev.map((p, i) => ({
              ...p,
              score: toPercent(results?.[i]?.score),
              bestRoleTitle: selectedJob.title,
              breakdown: results?.[i]?.breakdown || null,
              details: results?.[i]?.details || null,
            }))
          );
          return;
        } catch (e: any) {
          setMatchErr(`Match (batch) failed: ${e?.message || e}`);
          console.error("Match batch error", e);
          // fall through to best-role
        }
      }

      try {
        const perCandidate = await Promise.all(
          resumesForAPI.map((r) => MatchAPI.scoreAgainstAllJobs(r))
        );
        setPeople((prev) =>
          prev.map((p, i) => {
            const top = perCandidate[i]?.[0];
            return {
              ...p,
              score: toPercent(top?.score),
              bestRoleTitle: top?.title ?? null,
              breakdown: top?.breakdown || null,
              details: top?.details || null,
            };
          })
        );
      } catch (e: any) {
        setMatchErr(`Match (best-role) failed: ${e?.message || e}`);
        console.error("Match best-role error", e);
      }
    })();
  }, [selectedJob?.id, resumesForAPI, people.length]);

  // search & sort
  const visiblePeople = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? people.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.tags.some((t) => t.toLowerCase().includes(q))
        )
      : people.slice();

    switch (sort) {
      case "exp_desc":
        filtered.sort((a, b) => (b.years || 0) - (a.years || 0));
        break;
      case "exp_asc":
        filtered.sort((a, b) => (a.years || 0) - (b.years || 0));
        break;
      default:
        filtered.sort((a, b) => (b.score || 0) - (a.score || 0));
    }
    return filtered;
  }, [people, query, sort]);

  // Create a new role via API and update UI
  const createRole = async (payload: Omit<JobRequirements, "id">): Promise<JobRequirements> => {
    const BASE = apiBase();
    const res = await fetch(`${BASE}/api/v1/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `HTTP ${res.status}`);
    }
    const job = (await res.json()) as JobRequirements;
    setJobs((prev) => [job, ...prev]);
    setSelectedJob(job);
    return job;
  };

  return (
    <div className={`min-h-screen grid grid-cols-1 md:grid-cols-[260px_1fr] ${MAIN_BG}`}>
      {/* Sidebar */}
      <aside className="hidden md:block border-r border-gray-200 bg-white">
        <div className="p-5 text-xl font-bold">Recruiter</div>
        <nav className="px-3 space-y-1">
          <a
            className="block rounded-xl px-3 py-2 font-medium transition-colors duration-150"
            style={{ backgroundColor: ACTIVE_SIDEBAR_BG, color: PRIMARY_ACCENT }}
          >
            Dashboard
          </a>
          <a className="block rounded-xl px-3 py-2 text-gray-700 hover:bg-gray-100 transition-colors duration-150">
            Resumes
          </a>
          <a className="block rounded-xl px-3 py-2 text-gray-700 hover:bg-gray-100 transition-colors duration-150">
            Interviews
          </a>
          <a className="block rounded-xl px-3 py-2 text-gray-700 hover:bg-gray-100 transition-colors duration-150">
            Recommendations
          </a>
          <a className="block rounded-xl px-3 py-2 text-gray-700 hover:bg-gray-100 transition-colors duration-150">
            Settings
          </a>
        </nav>
      </aside>

      <main className="p-8">
        <header className="mb-6 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">Dashboard</h1>
            <p className="text-base text-gray-500">
              Welcome back! Here’s your recruitment overview.
            </p>
          </div>
          <div className="flex gap-2">
            <select
              className="input border border-gray-300 rounded-lg shadow-sm focus:border-[#007B80] focus:ring-1 focus:ring-[#007B80] transition-all duration-150"
              value={selectedJob?.id ?? ""}
              onChange={(e) =>
                setSelectedJob(jobs.find((j) => j.id === e.target.value) || null)
              }
            >
              <option value="">All Roles (best match)</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title}
                </option>
              ))}
            </select>

            {/* NEW: Create Role */}
            <button
              className="btn-secondary"
              style={{ borderColor: PRIMARY_ACCENT, color: PRIMARY_ACCENT }}
              onClick={() => setOpenCreateRole(true)}
            >
              + New Role
            </button>

            <button
              className="bg-[#007B80] text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-[#008C99] transition-colors duration-150"
              onClick={() => setOpenUpload(true)}
            >
              ⬆ Upload Resume
            </button>
          </div>
        </header>

        {/* visible API error */}
        {matchErr && (
          <div className="mb-6 rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-800 shadow-sm">
            {matchErr}. Check API base & CORS. (Open console for details.)
          </div>
        )}

        {/* Metric Cards */}
        <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <div className="text-sm text-gray-500">Total Applications</div>
            <div className="text-3xl font-extrabold text-gray-900">{people.length}</div>
            <div className="text-xs text-gray-400">in system</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <div className="text-sm text-gray-500">Pending Reviews</div>
            <div className="text-3xl font-extrabold text-gray-900">—</div>
            <div className="text-xs text-gray-400">auto</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <div className="text-sm text-gray-500">Scheduled Interviews</div>
            <div className="text-3xl font-extrabold text-gray-900">—</div>
            <div className="text-xs text-gray-400">this week</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <div className="text-sm text-gray-500">Top Matches</div>
            <div className="text-3xl font-extrabold text-gray-900">
              {people.filter((p) => (p.score || 0) >= 90).length}
            </div>
            <div className="text-xs text-gray-400">90%+ match</div>
          </div>
        </section>

        <div className="mb-4 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
          <div>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <input
                className="input w-full max-w-sm rounded-lg border border-gray-300 shadow-sm px-4 py-2 focus:border-[#007B80] focus:ring-1 focus:ring-[#007B80] transition-all duration-150"
                placeholder="Search candidates..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <div className="flex gap-2">
                <select
                  className="input rounded-lg border border-gray-300 shadow-sm px-4 py-2 focus:border-[#007B80] focus:ring-1 focus:ring-[#007B80] transition-all duration-150"
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                >
                  <option value="score_desc">Best Match</option>
                  <option value="exp_desc">Experience: High → Low</option>
                  <option value="exp_asc">Experience: Low → High</option>
                </select>
                <select className="input rounded-lg border border-gray-300 shadow-sm px-4 py-2 focus:border-[#007B80] focus:ring-1 focus:ring-[#007B80] transition-all duration-150">
                  <option>Status</option>
                </select>
              </div>
            </div>
            <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {visiblePeople.map((p) => (
                <CandidateCard key={p.id} person={p} />
              ))}
            </section>
          </div>
          {/* Questions Panel Container */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 h-fit">
            <div className="text-lg font-bold mb-3 text-gray-800">Generated Questions</div>
            <QuestionsPanel />
          </div>
        </div>
      </main>

      <UploadModal open={openUpload} onClose={() => setOpenUpload(false)}>
        <ResumeUpload />
      </UploadModal>

      {/* NEW: Create Role Modal */}
      <CreateRoleModal
        open={openCreateRole}
        onClose={() => setOpenCreateRole(false)}
        onCreate={createRole}
      />
    </div>
  );
}
