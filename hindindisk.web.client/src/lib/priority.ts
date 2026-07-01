import { nowInDenmark, todayInDenmark } from "./denmarkTime";

export type PriorityLevel = "asap" | "urgent" | "soon" | "today" | "future";

export type Priority = {
  level: PriorityLevel;
  label: string;
  dot: string;   // Tailwind bg color
  text: string;  // Tailwind text color
  badge: string; // Tailwind badge classes
  sort: number;  // lower = higher priority
};

const PRIORITIES: Record<PriorityLevel, Priority> = {
  asap:   { level: "asap",   label: "ASAP",   dot: "bg-red-500",    text: "text-red-700",    badge: "bg-red-100 text-red-700 border-red-200",       sort: 0 },
  urgent: { level: "urgent", label: "Urgent",  dot: "bg-orange-500", text: "text-orange-700", badge: "bg-orange-100 text-orange-700 border-orange-200", sort: 1 },
  soon:   { level: "soon",   label: "Soon",    dot: "bg-yellow-500", text: "text-yellow-700", badge: "bg-yellow-100 text-yellow-700 border-yellow-200", sort: 2 },
  today:  { level: "today",  label: "Today",   dot: "bg-blue-400",   text: "text-blue-700",   badge: "bg-blue-100 text-blue-700 border-blue-200",       sort: 3 },
  future: { level: "future", label: "Future",  dot: "bg-gray-300",   text: "text-gray-500",   badge: "bg-gray-100 text-gray-500 border-gray-200",       sort: 4 },
};

/**
 * Compute priority for an order or reservation.
 * @param date  "YYYY-MM-DD" or null/undefined (ASAP)
 * @param time  "HH:mm"      or null/undefined (ASAP)
 */
export function getPriority(date?: string | null, time?: string | null): Priority {
  if (!date || !time) return PRIORITIES.asap;

  const now = nowInDenmark();
  const scheduled = new Date(`${date}T${time}:00`);
  const diffMs = scheduled.getTime() - now.getTime();
  const diffMin = diffMs / 60_000;

  if (diffMin < 0) return PRIORITIES.asap;   // overdue
  if (diffMin <= 30) return PRIORITIES.asap;  // ≤ 30 min
  if (diffMin <= 60) return PRIORITIES.urgent; // ≤ 60 min
  if (diffMin <= 120) return PRIORITIES.soon;

  const todayStr = todayInDenmark();
  if (date === todayStr) return PRIORITIES.today;

  return PRIORITIES.future;
}
