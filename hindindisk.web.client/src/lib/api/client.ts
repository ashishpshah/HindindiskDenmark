export const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "";

export function resolveUrl(url: string): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${BASE}${url}`;
}

// Admin and customer sessions are independent — a request's own path decides which
// token applies, so a leftover admin session in the same browser can never get
// attached to a customer-facing request (or vice versa).
function isAdminPath(path: string): boolean {
  return path.startsWith("/api/admin") || path.startsWith(`${BASE}/api/admin`);
}

function getToken(path: string): string | null {
  try {
    const key = isAdminPath(path) ? "hind-admin-token" : "hind-token";
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as string) : null;
  } catch {
    return null;
  }
}

// Handles both { message } (business errors) and { errors } (ValidationProblemDetails)
function extractApiError(body: unknown, fallback: string): string {
  const b = body as { message?: string; errors?: Record<string, string[]> };
  if (b.errors) {
    const msgs = Object.values(b.errors).flat();
    if (msgs.length > 0) return msgs.map((m, i) => `${i + 1}) ${m}`).join("  ");
  }
  return b.message ?? fallback;
}

function handle401(path: string): void {
  if (isAdminPath(path)) {
    localStorage.removeItem("hind-admin-token");
    localStorage.removeItem("hind-admin-user");
    window.dispatchEvent(new Event("hind:admin-session-expired"));
  } else {
    localStorage.removeItem("hind-token");
    localStorage.removeItem("hind-user");
    window.dispatchEvent(new Event("hind:session-expired"));
  }
}

export async function apiUpload<T>(path: string, formData: FormData): Promise<T> {
  const token = getToken(path);
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    body: formData,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (res.status === 401) {
    // A 401 only means the *session* expired if we actually sent a token. If no
    // token was attached, this was an unauthenticated request (e.g. a login
    // attempt) — surface the backend's real error instead of claiming a session
    // that never existed just expired.
    if (token) {
      handle401(path);
      throw new Error("Your session has expired. Please log in again.");
    }
    const body = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(extractApiError(body, "Invalid credentials."));
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(extractApiError(body, res.statusText));
  }

  return res.json() as Promise<T>;
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken(path);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(init?.headers as Record<string, string> | undefined),
  };

  const res = await fetch(`${BASE}${path}`, { ...init, headers });

  if (res.status === 401) {
    // Same distinction as apiUpload above: only clear the session and show the
    // "expired" message when a token was actually sent and rejected. A bare
    // login/register call has no token, so a 401 there means bad credentials,
    // not an expired session — clearing "hind-user"/"hind-token" in that case
    // would also be wrong, since there was nothing to clear.
    if (token) {
      handle401(path);
      throw new Error("Your session has expired. Please log in again.");
    }
    const body = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(extractApiError(body, "Invalid credentials."));
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(extractApiError(body, res.statusText));
  }

  // 204 No Content — no body to parse (e.g. DELETE responses)
  if (res.status === 204 || res.headers.get("content-length") === "0") {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}
