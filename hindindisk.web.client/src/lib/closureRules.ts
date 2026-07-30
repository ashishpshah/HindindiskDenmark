export type ClosureRule = {
  scope: string;
  closureType: "DateRange" | "Weekly";
  startDate: string | null;
  endDate: string | null;
  dayOfWeek: number | null; // 0=Sun..6=Sat, mirrors JS Date.getDay()
  startTime: string | null;
  note: string | null;
};

export function scopeCovers(scope: string, service: string): boolean {
  return scope === "Restaurant" || scope === service;
}

export function checkClosed(rules: ClosureRule[], date: string, service: string): string | null {
  const d = new Date(date + "T00:00:00");
  const dow = d.getDay();

  for (const rule of rules) {
    if (!scopeCovers(rule.scope, service)) continue;
    if (rule.startTime !== null) continue; // partial-day only — doesn't block the whole date

    if (rule.closureType === "Weekly" && rule.dayOfWeek === dow) {
      return rule.note ?? "Closed";
    }
    if (
      rule.closureType === "DateRange" &&
      rule.startDate &&
      rule.endDate &&
      date >= rule.startDate &&
      date <= rule.endDate
    ) {
      return rule.note ?? "Closed";
    }
  }
  return null;
}
