// filepath: src/services/env.ts
// Detect the correct API base.
// DEV: vite on 5173 + FastAPI on 8000 -> default to http://localhost:8000
export function apiBase(): string {
  const v = (import.meta as any).env || {};
  const envUrl = v.VITE_API_BASE || v.VITE_API_URL || v.VITE_BACKEND_URL;
  if (envUrl) return String(envUrl).replace(/\/+$/, "");
  const loc = window.location;
  const host = loc.hostname || "localhost";
  // If dev server port looks like Vite, assume FastAPI at 8000; else same origin
  if (String(loc.port) === "5173") return `http://${host}:8000`;
  return `${loc.protocol}//${loc.host}`;
}
