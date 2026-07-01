const TZ = "Europe/Copenhagen";

/** Current date+time in Denmark as a native Date object. */
export function nowInDenmark(): Date {
  // Use Intl to get the Denmark wall-clock parts, then reassemble as a local Date.
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: false,
  });
  const parts = Object.fromEntries(fmt.formatToParts(new Date()).map(p => [p.type, p.value]));
  // Construct as local time (no Z / offset) so arithmetic stays in Denmark wall-clock
  return new Date(
    `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}`
  );
}

/** Today's date in Denmark as "YYYY-MM-DD". */
export function todayInDenmark(): string {
  const d = nowInDenmark();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
