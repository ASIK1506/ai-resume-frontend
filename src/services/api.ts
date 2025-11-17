// File: src/services/api.ts
/**
 * Central API helper.
 * Use VITE_API_BASE to target your backend (set in .env).
 * If VITE_API_BASE is not set, default to empty string (same origin).
 */

export const API_BASE = (import.meta.env.VITE_API_BASE as string) || "";

export async function postJSON<T = any>(
  path: string,
  body: unknown,
  opts?: { signal?: AbortSignal }
): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: opts?.signal,
    credentials: "include",
  });

  const text = await res.text();
  let data: any;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { message: text };
  }
  if (!res.ok) {
    const errMessage = data?.detail || data?.message || `Request failed: ${res.status}`;
    throw new Error(errMessage);
  }
  return data;
}
