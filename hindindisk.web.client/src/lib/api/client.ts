export const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "";

function getToken(): string | null {
  try {
    // Admin token takes precedence; only one zone's session is ever active at a time
    const admin = localStorage.getItem("hind-admin-token");
    if (admin) return JSON.parse(admin) as string;
    const client = localStorage.getItem("hind-token");
    return client ? (JSON.parse(client) as string) : null;
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

function handle401(): void {
  const wasAdmin = !!localStorage.getItem("hind-admin-token");
  if (wasAdmin) {
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
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    body: formData,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (res.status === 401) {
    handle401();
    throw new Error("Your session has expired. Please log in again.");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(extractApiError(body, res.statusText));
  }

  return res.json() as Promise<T>;
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(init?.headers as Record<string, string> | undefined),
  };

  const res = await fetch(`${BASE}${path}`, { ...init, headers });

  // Session expired — clear whichever zone was active and notify context
  if (res.status === 401) {
    handle401();
    throw new Error("Your session has expired. Please log in again.");
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
