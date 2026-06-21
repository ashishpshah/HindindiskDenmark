const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:5000";

function getToken(): string | null {
  try {
    const raw = localStorage.getItem("hind-token");
    return raw ? (JSON.parse(raw) as string) : null;
  } catch {
    return null;
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(init?.headers as Record<string, string> | undefined),
  };

  const res = await fetch(`${BASE}${path}`, { ...init, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error((body as { message?: string }).message ?? res.statusText);
  }

  return res.json() as Promise<T>;
}
