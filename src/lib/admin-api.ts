/**
 * admin-api.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Architecture:
 *
 *  Frontend  →  localhost:5000/api  (your local Node.js backend)
 *                    ↓
 *              nacosid.tmb.it.com  (central PHP system — backend talks to this)
 *
 *  Voting:   →  localhost:5050/api  (local voting backend)
 *
 * The frontend NEVER calls nacosid.tmb.it.com directly.
 * The local backend handles all proxying to the central system.
 */

const MAIN_API_BASE    = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/$/, "");
const VOTING_API_BASE  = (import.meta.env.VITE_VOTING_API_URL || "http://localhost:5050/api").replace(/\/$/, "");

// ─── URL builders ─────────────────────────────────────────────────────────────

const mainUrl   = (endpoint: string) => `${MAIN_API_BASE}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
const votingUrl = (endpoint: string) => `${VOTING_API_BASE}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

// ─── Error helper ────────────────────────────────────────────────────────────

const parseError = async (response: Response) => {
  const payload = await response.json().catch(() => null);
  throw new Error(payload?.message || payload?.error || `Request failed (${response.status})`);
};

// ─── Admin Login ──────────────────────────────────────────────────────────────

export const loginToAdminSystems = async (username: string, password: string) => {
  let mainPayload: any   = null;
  let votingPayload: any = null;
  let mainError: any     = null;
  let votingError: any   = null;

  // 1. Login via local Node.js backend
  try {
    const response = await fetch(mainUrl("/admin-auth/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (response.ok) {
      mainPayload = await response.json();
    } else {
      const payload = await response.json().catch(() => null);
      mainError = payload?.message || `Main server error (${response.status})`;
    }
  } catch {
    mainError = "Main backend (localhost:5000) is unreachable. Run: cd backend && npm start";
  }

  // 2. Login to voting backend
  try {
    const response = await fetch(votingUrl("/admin/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (response.ok) {
      votingPayload = await response.json();
    } else {
      const payload = await response.json().catch(() => null);
      votingError = payload?.message || `Voting server error (${response.status})`;
    }
  } catch {
    votingError = "Voting backend (localhost:5050) is unreachable. Run: cd voting-backend && npm start";
  }

  // If both fail, throw
  if (!mainPayload && !votingPayload) {
    throw new Error(
      `Login failed.\n\nMain backend: ${mainError}\n\nVoting backend: ${votingError}`
    );
  }

  if (mainPayload?.token)   localStorage.setItem("adminToken",       mainPayload.token);
  if (votingPayload?.token) localStorage.setItem("votingAdminToken", votingPayload.token);

  const activeUser = mainPayload?.user || votingPayload?.user || {
    name: "NACOS Admin",
    username,
    role: "admin",
  };

  localStorage.setItem("adminUser", JSON.stringify(activeUser));
  return { main: mainPayload, voting: votingPayload, mainError, votingError };
};

// ─── Main backend fetch (student data, flags, executives, events, blogs, settings)
// The backend proxies student data from nacosid.tmb.it.com internally.

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

  if (!response.ok) await parseError(response);
  return response.json();
};

// ─── Voting admin fetch ───────────────────────────────────────────────────────

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

// ─── Session ──────────────────────────────────────────────────────────────────

export const clearAdminSession = () => {
  localStorage.removeItem("adminToken");
  localStorage.removeItem("votingAdminToken");
  localStorage.removeItem("adminUser");
};
