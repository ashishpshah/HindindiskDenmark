import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import { todayInDenmark } from "@/lib/denmarkTime";

export type ClosureRule = {
  scope: string;
  closureType: "DateRange" | "Weekly";
  startDate: string | null;
  endDate: string | null;
  dayOfWeek: number | null;
  startTime: string | null;
  note: string | null;
  noteDa: string | null;
  displayBeforeDays: number;
};

export type UpcomingClosure = {
  scope: string;
  startDate: string;
  endDate: string;
  note: string | null;
  noteDa: string | null;
};

export function useUpcomingClosures(branchId: number | undefined) {
  const { data = [] } = useQuery<ClosureRule[]>({
    queryKey: ["branch-closures", branchId],
    queryFn:  () => apiFetch(`/api/locations/closures?branchId=${branchId}`),
    enabled:  !!branchId,
    staleTime: 30_000,
  });

  const today = todayInDenmark();

  const upcoming: UpcomingClosure[] = [];

  for (const rule of data) {
    if (rule.closureType === "DateRange" && rule.startDate && rule.endDate && rule.displayBeforeDays > 0) {
      const dStart = new Date(rule.startDate + "T00:00:00");
      dStart.setDate(dStart.getDate() - rule.displayBeforeDays);
      const warnStartDate = dStart.toISOString().slice(0, 10);
      
      if (today >= warnStartDate && today <= rule.endDate) {
        upcoming.push({
          scope: rule.scope,
          startDate: rule.startDate,
          endDate: rule.endDate,
          note: rule.note,
          noteDa: rule.noteDa,
        });
      }
    }
  }

  return upcoming;
}
