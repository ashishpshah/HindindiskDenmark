export function lsGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw !== null ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function lsSet(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch { /* storage unavailable */ }
}

export function lsRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch { /* storage unavailable */ }
}
