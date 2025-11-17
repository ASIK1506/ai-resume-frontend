// // ===========================================
// // filepath: src/components/CandidateCard.tsx
// // ===========================================
// import React from "react";

// type Person = {
//   id?: string;
//   name: string;
//   role: string;
//   initials: string;
//   score: number;
//   years: number;
//   updated: string;
//   badge: string;
//   tags: string[];
// };

// export default function CandidateCard({ person }: { person: Person }) {
//   return (
//     <div className="card p-4 relative">
//       <div className="absolute right-3 top-3">
//         <span className="px-2 py-1 rounded-xl bg-blue-600 text-white text-xs font-semibold">
//           {Math.max(0, Math.min(100, Math.round(person.score)))}% match
//         </span>
//       </div>
//       <div className="flex items-center gap-3">
//         <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center font-bold">
//           {person.initials}
//         </div>
//         <div>
//           <div className="font-semibold">{person.name}</div>
//           <div className="text-xs text-[var(--muted)]">{person.role}</div>
//         </div>
//       </div>
//       <div className="mt-2 text-xs text-[var(--muted)]">{person.years} years • {person.updated}</div>
//       <div className="mt-3 flex flex-wrap gap-2">
//         {person.tags.map((t) => <span key={t} className="tag">{t}</span>)}
//       </div>
//       <div className="mt-3 flex gap-2">
//         <button className="btn">View Details</button>
//         <button className="btn">Schedule Interview</button>
//       </div>
//     </div>
//   );
// }




// ===========================================
// filepath: src/components/CandidateCard.tsx
// ===========================================
import React, { useState } from "react";
import { API_BASE } from "../services/api"; // <-- ensure this exists or replace with your API url

type Person = {
  id?: string;               // <-- this is used as resume_id
  name: string;
  role: string;
  initials: string;
  score: number;
  years: number;
  updated: string;
  badge: string;
  tags: string[];
};

export default function CandidateCard({ person }: { person: Person }) {
  const [open, setOpen] = useState(false);

  const [interviewDate, setInterviewDate] = useState("");
  const [interviewTime, setInterviewTime] = useState("");
  const [interviewLink, setInterviewLink] = useState("");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function sendInterviewMail(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);

    if (!person.id) {
      setErr("Missing resume ID.");
      return;
    }
    if (!interviewDate || !interviewTime || !interviewLink) {
      setErr("Please fill all fields.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/interview/send-interview-mail/${person.id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            interview_date: interviewDate,
            interview_time: interviewTime,
            interview_link: interviewLink,
          }),
        }
      );

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to send email");
      }

      setMsg("Interview email sent!");
      setTimeout(() => setOpen(false), 800);
    } catch (error: any) {
      setErr(error?.message || "Error sending email.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* CARD */}
      <div className="card p-4 relative">
        <div className="absolute right-3 top-3">
          <span className="px-2 py-1 rounded-xl bg-blue-600 text-white text-xs font-semibold">
            {Math.max(0, Math.min(100, Math.round(person.score)))}% match
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center font-bold">
            {person.initials}
          </div>
          <div>
            <div className="font-semibold">{person.name}</div>
            <div className="text-xs text-[var(--muted)]">{person.role}</div>
          </div>
        </div>

        <div className="mt-2 text-xs text-[var(--muted)]">
          {person.years} years • {person.updated}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {person.tags.map((t) => (
            <span key={t} className="tag">
              {t}
            </span>
          ))}
        </div>

        <div className="mt-3 flex gap-2">
          <button className="btn">View Details</button>

          {/* Schedule Interview triggers modal open */}
          <button className="btn" onClick={() => setOpen(true)}>
            Schedule Interview
          </button>
        </div>
      </div>

      {/* MODAL */}
      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-5 rounded-xl w-[380px] shadow-xl">
            <h2 className="text-lg font-semibold mb-3">
              Schedule Interview — {person.name}
            </h2>

            <form onSubmit={sendInterviewMail} className="space-y-3">
              <div>
                <label className="text-sm font-medium">Interview Date</label>
                <input
                  type="date"
                  value={interviewDate}
                  onChange={(e) => setInterviewDate(e.target.value)}
                  className="input w-full mt-1"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium">Interview Time</label>
                <input
                  type="time"
                  value={interviewTime}
                  onChange={(e) => setInterviewTime(e.target.value)}
                  className="input w-full mt-1"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium">Meeting Link</label>
                <input
                  type="url"
                  placeholder="https://zoom.us/..."
                  value={interviewLink}
                  onChange={(e) => setInterviewLink(e.target.value)}
                  className="input w-full mt-1"
                  required
                />
              </div>

              {err && <div className="text-red-600 text-sm">{err}</div>}
              {msg && <div className="text-green-600 text-sm">{msg}</div>}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="btn bg-gray-200 text-black"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </button>

                <button type="submit" className="btn" disabled={loading}>
                  {loading ? "Sending..." : "Send Email"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
