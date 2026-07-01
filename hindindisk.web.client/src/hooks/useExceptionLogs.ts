import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";

export type ExceptionLogDto = {
  id: number;
  occurredAt: string;
  httpMethod: string;
  requestPath: string;
  queryString: string | null;
  statusCode: number;
  exceptionType: string;
  exceptionMessage: string;
  stackTrace: string | null;
  userId: number | null;
  clientIp: string | null;
};

export type ExceptionLogPageDto = {
  items: ExceptionLogDto[];
  total: number;
};

export type ExceptionLogFilters = {
  page:     number;
  pageSize: number;
  search?:  string;
  from?:    string;
  to?:      string;
  module?:  string;
};

export function useExceptionLogs(filters: ExceptionLogFilters) {
  const qs = new URLSearchParams();
  qs.set("page",     String(filters.page));
  qs.set("pageSize", String(filters.pageSize));
  if (filters.search) qs.set("search", filters.search);
  if (filters.from)   qs.set("from",   filters.from);
  if (filters.to)     qs.set("to",     filters.to + "T23:59:59.999");
  if (filters.module) qs.set("module", filters.module);

  return useQuery({
    queryKey: ["exception-logs", filters],
    queryFn:  () => apiFetch<ExceptionLogPageDto>(`/api/admin/exception-logs?${qs}`),
  });
}
