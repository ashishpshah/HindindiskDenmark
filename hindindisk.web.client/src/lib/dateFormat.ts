const TZ = "Europe/Copenhagen";

/** Returns "DD-MM-YYYY" from an ISO datetime or Date (timezone-aware) */
export function formatDate(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return d
    .toLocaleDateString("en-GB", { timeZone: TZ, day: "2-digit", month: "2-digit", year: "numeric" })
    .replace(/\//g, "-");
}

/** Returns "hh:mm AM/PM" from an ISO datetime or Date (timezone-aware) */
export function formatTime(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleTimeString("en-US", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: true });
}

/** Returns "DD-MM-YYYY hh:mm AM/PM" from an ISO datetime or Date */
export function formatDateTime(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return `${formatDate(d)} ${formatTime(d)}`;
}

/** Converts a plain "YYYY-MM-DD" date string to "DD-MM-YYYY" (no timezone conversion) */
export function formatDateStr(date: string): string {
  if (!date) return date;
  const [y, m, d] = date.split("-");
  return `${d}-${m}-${y}`;
}

/** Converts a plain "HH:mm" 24-hour time string to "hh:mm AM/PM" */
export function formatTimeStr(time: string): string {
  if (!time) return time;
  const [hStr, mStr] = time.split(":");
  const h      = parseInt(hStr, 10);
  const suffix = h >= 12 ? "PM" : "AM";
  const h12    = h % 12 || 12;
  return `${String(h12).padStart(2, "0")}:${mStr} ${suffix}`;
}
