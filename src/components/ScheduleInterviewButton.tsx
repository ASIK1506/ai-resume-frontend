// File: src/components/ScheduleInterviewButton.tsx
import React, { useState } from "react";
import { postJSON } from "../services/api";

/**
 * ScheduleInterviewButton
 * Props: resumeId (backend resume identifier), optional candidateName
 *
 * Minimal UI with inline styles to avoid external deps; replace with your design system.
 */

/* Keep props typed for clarity */
type Props = {
  resumeId: string;
  candidateName?: string;
  className?: string;
};

export default function ScheduleInterviewButton({
  resumeId,
  candidateName,
  className,
}: Props) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [link, setLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Minimal validation
    if (!date || !time || !link) {
      setError("Please fill date, time and meeting link.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        interview_date: date,
        interview_time: time,
        interview_link: link,
      };

      // backend route: /api/interview/send-interview-mail/{resume_id}
      await postJSON(`/api/interview/send-interview-mail/${encodeURIComponent(resumeId)}`, payload);

      setSuccess("Interview email sent.");
      // optionally auto-close after short delay
      setTimeout(() => {
        setOpen(false);
        setSuccess(null);
        setDate("");
        setTime("");
        setLink("");
      }, 900);
    } catch (err: any) {
      setError(err?.message || "Failed to send interview email.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={className}
        style={{
          background: "#1366ff",
          color: "white",
          borderRadius: 8,
          padding: "8px 12px",
          border: "none",
          cursor: "pointer",
        }}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        Schedule Interview
      </button>

      {open && (
        /* simple modal overlay */
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.4)",
            zIndex: 9999,
            padding: 20,
          }}
          onMouseDown={() => setOpen(false)}
        >
          <div
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              width: 420,
              background: "white",
              borderRadius: 12,
              padding: 20,
              boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
            }}
          >
            <h3 style={{ marginTop: 0 }}>
              Schedule Interview {candidateName ? `— ${candidateName}` : ""}
            </h3>

            <form onSubmit={handleSend}>
              <label style={{ display: "block", marginBottom: 8 }}>
                Date
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  style={{ width: "100%", padding: 8, marginTop: 6 }}
                  required
                />
              </label>

              <label style={{ display: "block", marginBottom: 8 }}>
                Time
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  style={{ width: "100%", padding: 8, marginTop: 6 }}
                  required
                />
              </label>

              <label style={{ display: "block", marginBottom: 12 }}>
                Meeting link
                <input
                  type="url"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="https://zoom.us/..."
                  style={{ width: "100%", padding: 8, marginTop: 6 }}
                  required
                />
              </label>

              {error && (
                <div style={{ color: "crimson", marginBottom: 8 }}>{error}</div>
              )}
              {success && (
                <div style={{ color: "green", marginBottom: 8 }}>{success}</div>
              )}

              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid #ddd",
                    background: "white",
                    cursor: "pointer",
                  }}
                  disabled={loading}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  style={{
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "none",
                    background: loading ? "#99b9ff" : "#1366ff",
                    color: "white",
                    cursor: "pointer",
                  }}
                  disabled={loading}
                >
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
