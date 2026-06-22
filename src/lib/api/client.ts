const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:5000";

function getToken(): string | null {
  try {
    const raw = localStorage.getItem("hind-token");
    return raw ? (JSON.parse(raw) as string) : null;
  } catch {
    return null;
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
    localStorage.removeItem("hind-token");
    localStorage.removeItem("hind-user");
    window.dispatchEvent(new Event("hind:session-expired"));
    throw new Error("Your session has expired. Please log in again.");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error((body as { message?: string }).message ?? res.statusText);
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

  // Session expired — clear local state and notify AuthContext
  if (res.status === 401) {
    localStorage.removeItem("hind-token");
    localStorage.removeItem("hind-user");
    window.dispatchEvent(new Event("hind:session-expired"));
    throw new Error("Your session has expired. Please log in again.");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error((body as { message?: string }).message ?? res.statusText);
  }

  // 204 No Content — no body to parse (e.g. DELETE responses)
  if (res.status === 204 || res.headers.get("content-length") === "0") {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}
