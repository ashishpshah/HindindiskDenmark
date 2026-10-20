import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";

export type FoodControlReportDto = {
  branch: string;
  text: string;
  textDa: string;
  /** Public URL of the report PDF served from wwwroot. */
  url: string;
  /** External findsmiley.dk profile link for the branch (empty when not configured). */
  smileyUrl: string | null;
  isActive: boolean;
};

export function useFoodControlReports() {
  return useQuery({
    queryKey: ["food-control-reports"],
    queryFn:  () => apiFetch<FoodControlReportDto[]>("/api/locations/food-control-reports"),
    staleTime: 1000 * 60 * 10,
  });
}

/** Lowercases and strips diacritics so "Østerbro" and "Osterbro" compare equal. */
export function normalizeBranchKey(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Finds the report configured for a branch. The config key is a short suburb key
 * (e.g. "Vesterbro") while the branch's own name is the full display name
 * (e.g. "Hind Indisk Vesterbro") — so match loosely, in either direction.
 */
export function findFoodControlReport(
  reports: FoodControlReportDto[],
  ...branchNames: (string | null | undefined)[]
): FoodControlReportDto | undefined {
  const labels = branchNames
    .filter((n): n is string => !!n)
    .map(normalizeBranchKey)
    .filter(Boolean);
  if (!labels.length) return undefined;

  return reports.find((r) => {
    const key = normalizeBranchKey(r.branch);
    if (!key) return false;
    return labels.some((l) => l.includes(key) || key.includes(l));
  });
}
