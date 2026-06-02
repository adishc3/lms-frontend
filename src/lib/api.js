/**
 * Central API client
 *
 * VITE_API_BASE_URL is read from the .env file at build time.
 *  - Dev  → leave it empty; Vite proxies /api/* → http://127.0.0.1:8000
 *  - Prod → set it to your deployed backend, e.g. https://my-backend.onrender.com
 *
 * Usage:
 *   import apiFetch from "@/lib/api"
 *   const res = await apiFetch("/api/auth/me")
 *   const res = await apiFetch("/api/courses/", { method: "POST", body: JSON.stringify(data) })
 */

const BASE = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "")

/**
 * Returns the full URL for an API path.
 * @param {string} path  e.g. "/api/auth/login"
 */
export function apiUrl(path) {
  return `${BASE}${path}`
}

/**
 * fetch() wrapper that:
 *  - Prepends VITE_API_BASE_URL to every path
 *  - Automatically attaches Authorization header from localStorage / sessionStorage
 *
 * @param {string}      path   API path, e.g. "/api/auth/me"
 * @param {RequestInit} [opts] Standard fetch options
 * @returns {Promise<Response>}
 */
export async function apiFetch(path, opts = {}) {
  const token =
    localStorage.getItem("access_token") ||
    sessionStorage.getItem("access_token")

  const headers = { ...(opts.headers ?? {}) }

  if (token && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${token}`
  }

  return fetch(apiUrl(path), { ...opts, headers })
}

export default apiFetch
