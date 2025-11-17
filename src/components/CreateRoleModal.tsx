
// filepath: src/components/CreateRoleModal.tsx
import React, { useEffect, useMemo, useState } from "react";
import type { JobRequirements } from "@/services/http";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreate: (payload: Omit<JobRequirements, "id">) => Promise<JobRequirements>;
};

const EDU_OPTIONS = [
  { value: 0, label: "None" },
  { value: 1, label: "High School / GED" },
  { value: 2, label: "Associate" },
  { value: 3, label: "Bachelor's" },
  { value: 4, label: "Master's" },
  { value: 5, label: "Doctorate" },
];

function splitList(v: string): string[] {
  // why: accept comma/newline/“and” separated lists
  return v
    .split(/[\n,]|(?:\band\b)/gi)
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function CreateRoleModal({ open, onClose, onCreate }: Props) {
  const [title, setTitle] = useState("");
  const [must, setMust] = useState("");
  const [nice, setNice] = useState("");
  const [minYears, setMinYears] = useState<number>(0);
  const [edu, setEdu] = useState<number>(3);
  const [desc, setDesc] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    setTitle("");
    setMust("");
    setNice("");
    setMinYears(0);
    setEdu(3);
    setDesc("");
    setSaving(false);
    setErr(null);
  }, [open]);

  const disabled = useMemo(
    () => saving || title.trim().length === 0,
    [saving, title]
  );

  const handleSave = async () => {
    setErr(null);
    setSaving(true);
    try {
      const payload: Omit<JobRequirements, "id"> = {
        title: title.trim(),
        description: desc.trim(),
        min_years_experience: Number.isFinite(minYears) ? minYears : 0,
        required_education: Number.isFinite(edu) ? edu : 0,
        must_have_skills: splitList(must),
        nice_to_have_skills: splitList(nice),
      };
      const created = await onCreate(payload);
      if (created) onClose();
    } catch (e: any) {
      setErr(e?.message || "Failed to create role");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div className="text-lg font-semibold">Create Role / Requirements</div>
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="space-y-4 p-6">
          {err && (
            <div className="rounded border border-yellow-300 bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
              {err}
            </div>
          )}

          <div className="grid gap-4">
            <label className="grid gap-1">
              <span className="text-sm font-medium">Title *</span>
              <input
                className="input"
                placeholder="e.g., Java Developer"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </label>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="grid gap-1">
                <span className="text-sm font-medium">Min. Years Experience</span>
                <input
                  className="input"
                  type="number"
                  min={0}
                  value={minYears}
                  onChange={(e) => setMinYears(parseInt(e.target.value || "0", 10))}
                />
              </label>

              <label className="grid gap-1">
                <span className="text-sm font-medium">Required Education</span>
                <select
                  className="input"
                  value={edu}
                  onChange={(e) => setEdu(parseInt(e.target.value, 10))}
                >
                  {EDU_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="grid gap-1">
              <span className="text-sm font-medium">Must-have Skills</span>
              <textarea
                className="input"
                rows={3}
                placeholder="React, TypeScript, GraphQL"
                value={must}
                onChange={(e) => setMust(e.target.value)}
              />
              <span className="text-xs text-[var(--muted)]">
                Separate by commas or new lines. We’ll split safely.
              </span>
            </label>

            <label className="grid gap-1">
              <span className="text-sm font-medium">Nice-to-have Skills</span>
              <textarea
                className="input"
                rows={3}
                placeholder="AWS, Docker, Terraform"
                value={nice}
                onChange={(e) => setNice(e.target.value)}
              />
            </label>

            <label className="grid gap-1">
              <span className="text-sm font-medium">Description</span>
              <textarea
                className="input"
                rows={4}
                placeholder="Short summary of the role…"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
              />
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t px-6 py-4">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn" onClick={handleSave} disabled={disabled}>
            {saving ? "Saving…" : "Create Role"}
          </button>
        </div>
      </div>
    </div>
  );
}