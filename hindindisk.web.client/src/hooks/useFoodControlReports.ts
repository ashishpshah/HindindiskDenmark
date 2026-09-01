import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";

export type FoodControlReportDto = {
  branch: string;
  text: string;
  textDa: string;
  url: string;
  isActive: boolean;
};

export function useFoodControlReports() {
  return useQuery({
    queryKey: ["food-control-reports"],
    queryFn:  () => apiFetch<FoodControlReportDto[]>("/api/locations/food-control-reports"),
    staleTime: 1000 * 60 * 10,
  });
}
