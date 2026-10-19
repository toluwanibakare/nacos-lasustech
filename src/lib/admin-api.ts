/**
 * admin-api.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Architecture:
 *
 *  Frontend  →  localhost:5000/api  (your local Node.js backend)
 *                    ↓
 *              nacosid.tmb.it.com  (central PHP system, the backend talks to this)
 *
 *  Voting:   →  localhost:5050/api  (local voting backend)
 *
 * The frontend NEVER calls nacosid.tmb.it.com directly.
 * The local backend handles all proxying to the central system.
 */

const MAIN_API_BASE    = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/$/, "");
// const VOTING_API_BASE  = (import.meta.env.VITE_VOTING_API_URL || "http://localhost:5050/api").replace(/\/$/, "");

// ─── URL builders ─────────────────────────────────────────────────────────────

const mainUrl   = (endpoint: string) => `${MAIN_API_BASE}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
// const votingUrl = (endpoint: string) => `${VOTING_API_BASE}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

// ─── Error helper ────────────────────────────────────────────────────────────

const parseError = async (response: Response) => {
  const payload = await response.json().catch(() => null);
  throw new Error(payload?.message || payload?.error || `Request failed (${response.status})`);
};

// ─── Admin Login ──────────────────────────────────────────────────────────────
// Main backend only. The voting login below is switched off (voting is disabled).

export const loginToAdminSystems = async (username: string, password: string) => {
  let response: Response;
  try {
    response = await fetch(mainUrl("/admin-auth/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
  } catch {
    throw new Error("The server is unreachable. Check your connection and try again.");
  }

  if (!response.ok) await parseError(response);
  const mainPayload = await response.json();

  if (mainPayload?.token) localStorage.setItem("adminToken", mainPayload.token);
  const activeUser = mainPayload?.user || { name: "NACOS Admin", username, role: "admin" };
  localStorage.setItem("adminUser", JSON.stringify(activeUser));
  return { main: mainPayload, user: activeUser };
};

/* Voting login (disabled while voting/awards is off):
  try {
    const response = await fetch(votingUrl("/admin/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (response.ok) votingPayload = await response.json();
  } catch { votingError = "Voting backend unreachable."; }
  if (votingPayload?.token) localStorage.setItem("votingAdminToken", votingPayload.token);
*/

// ─── Main backend fetch (student data, flags, executives, events, blogs, settings)
// The backend proxies student data from nacosid.tmb.it.com internally.

export const ADMIN_UNAUTHORIZED_EVENT = "admin-unauthorized";

const handleUnauthorized = () => {
  clearAdminSession();
  window.dispatchEvent(new Event(ADMIN_UNAUTHORIZED_EVENT));
};

export const adminFetch = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem("adminToken");
  if (!token) throw new Error("Admin token not available.");

  const response = await fetch(mainUrl(endpoint), {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (response.status === 401) handleUnauthorized();
  if (!response.ok) await parseError(response);
  return response.json();
};

/** POST JSON with the admin token and return a binary file (used for ID card generation). */
export const adminDownload = async (endpoint: string, body: unknown): Promise<{ blob: Blob; filename: string; skippedCount: number; skippedNames: string }> => {
  const token = localStorage.getItem("adminToken");
  if (!token) throw new Error("Admin token not available.");

  const response = await fetch(mainUrl(endpoint), {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body ?? {}),
  });

  if (response.status === 401) handleUnauthorized();
  if (!response.ok) await parseError(response);

  const blob = await response.blob();
  const disposition = response.headers.get("Content-Disposition") || "";
  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition);
  const ext = blob.type.includes("zip") ? "zip" : blob.type.includes("png") ? "png" : "bin";
  const skippedCount = Number(response.headers.get("X-Skipped-Count") || 0);
  const skippedNames = decodeURIComponent(response.headers.get("X-Skipped-Names") || "");
  return { blob, filename: match ? decodeURIComponent(match[1]) : `id-cards.${ext}`, skippedCount, skippedNames };
};

// ─── Voting admin fetch ───────────────────────────────────────────────────────

/* Disabled while voting is off:
export const votingAdminFetch = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem("votingAdminToken");
  if (!token) throw new Error("Voting admin token not available.");

  const response = await fetch(votingUrl(endpoint), {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) await parseError(response);
  return response.json();
};
*/

// ─── Session ──────────────────────────────────────────────────────────────────

export const clearAdminSession = () => {
  localStorage.removeItem("adminToken");
  localStorage.removeItem("votingAdminToken");
  localStorage.removeItem("adminUser");
};
