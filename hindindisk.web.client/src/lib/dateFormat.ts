const TZ = "Europe/Copenhagen";

/** Returns "dd-MM-yyyy" */
export function formatDate(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return d
    .toLocaleDateString("en-GB", { timeZone: TZ, day: "2-digit", month: "2-digit", year: "numeric" })
    .replace(/\//g, "-");
}

/** Returns "hh:mm AM/PM" */
export function formatTime(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleTimeString("en-US", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: true });
}

/** Returns "dd-MM-yyyy hh:mm AM/PM" */
export function formatDateTime(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return `${formatDate(d)} ${formatTime(d)}`;
}
