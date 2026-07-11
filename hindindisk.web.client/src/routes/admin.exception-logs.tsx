import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search, ChevronDown, ChevronRight, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import { useExceptionLogs, type ExceptionLogDto, type LogLevel } from "@/hooks/useExceptionLogs";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { formatDateTime } from "@/lib/dateFormat";

export const Route = createFileRoute("/admin/exception-logs")({ component: ExceptionLogsPage });

// ── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 50;

const LOG_LEVELS: { label: string; value: LogLevel }[] = [
  { label: "All Logs",   value: "all"       },
  { label: "Info",       value: "info"      },
  { label: "Exceptions", value: "exception" },
];

const MODULES = [
  { label: "All modules", value: "" },
  { label: "/api/auth",         value: "/api/auth" },
  { label: "/api/admin",        value: "/api/admin" },
  { label: "/api/orders",       value: "/api/orders" },
  { label: "/api/reservations", value: "/api/reservations" },
  { label: "/api/menu",         value: "/api/menu" },
  { label: "/api/offers",       value: "/api/offers" },
  { label: "/api/addresses",    value: "/api/addresses" },
  { label: "/api/customer",     value: "/api/customer" },
  { label: "/api/location",     value: "/api/location" },
];

const METHOD_COLORS: Record<string, string> = {
  GET:    "bg-blue-100   text-blue-700",
  POST:   "bg-green-100  text-green-700",
  PUT:    "bg-amber-100  text-amber-700",
  PATCH:  "bg-orange-100 text-orange-700",
  DELETE: "bg-red-100    text-red-700",
};

// ── Stack trace expand row ────────────────────────────────────────────────────

function ExpandableRow({ log }: { log: ExceptionLogDto }) {
  const [open, setOpen] = useState(false);
  if (!log.stackTrace) return null;
  return (
    <div>
      <button
        onClick={() => setOpen(v => !v)}
        data-tagid={`button-exception-logs-stacktrace-${log.id}`}
        className="flex items-center gap-1 text-xs text-primary hover:underline"
      >
        {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        {open ? "Hide" : "Stack trace"}
      </button>
      {open && (
        <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-muted p-3 text-[10px] leading-relaxed text-muted-foreground whitespace-pre-wrap break-all">
          {log.stackTrace}
        </pre>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

function ExceptionLogsPage() {
  const { adminUser } = useAdminAuth();

  // SystemAdmin-only guard
  if (adminUser?.role !== "SystemAdmin") {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
        <AlertTriangle className="h-10 w-10 text-destructive" />
        <h2 className="font-display text-xl font-bold">Access Denied</h2>
        <p className="text-sm text-muted-foreground">This page is restricted to System Administrators.</p>
      </div>
    );
  }

  const [page,     setPage]     = useState(1);
  const [search,   setSearch]   = useState("");
  const [from,     setFrom]     = useState("");
  const [to,       setTo]       = useState("");
  const [module,   setModule]   = useState("");
  const [logLevel, setLogLevel] = useState<LogLevel>("all");

  // Reset to page 1 whenever filters change
  const applySearch   = (v: string)   => { setSearch(v);   setPage(1); };
  const applyFrom     = (v: string)   => { setFrom(v);     setPage(1); };
  const applyTo       = (v: string)   => { setTo(v);       setPage(1); };
  const applyModule   = (v: string)   => { setModule(v);   setPage(1); };
  const applyLogLevel = (v: LogLevel) => { setLogLevel(v); setPage(1); };

  const { data, isLoading, refetch } = useExceptionLogs({
    page,
    pageSize: PAGE_SIZE,
    search:   search   || undefined,
    from:     from     || undefined,
    to:       to       || undefined,
    module:   module   || undefined,
    logLevel,
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const columns: ColumnDef<ExceptionLogDto, unknown>[] = [
    {
      accessorKey: "occurredAt",
      header: "Time",
      cell: info => (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {formatDateTime(info.getValue<string>())}
        </span>
      ),
    },
    {
      accessorKey: "httpMethod",
      header: "Method",
      cell: info => (
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${METHOD_COLORS[info.getValue<string>()] ?? "bg-gray-100 text-gray-700"}`}>
          {info.getValue<string>()}
        </span>
      ),
    },
    {
      accessorKey: "requestPath",
      header: "Path",
      cell: info => (
        <span className="font-mono text-xs">{info.getValue<string>()}</span>
      ),
    },
    {
      accessorKey: "exceptionType",
      header: "Exception",
      cell: info => {
        const full = info.getValue<string | null>();
        if (!full) return <span className="text-xs text-muted-foreground">—</span>;
        const short = full.split(".").at(-1) ?? full;
        return <span className="text-xs font-medium text-destructive" title={full}>{short}</span>;
      },
    },
    {
      accessorKey: "exceptionMessage",
      header: "Message",
      cell: info => {
        const msg = info.getValue<string | null>();
        if (!msg) return <span className="text-xs text-muted-foreground">—</span>;
        return (
          <span className="text-xs text-muted-foreground line-clamp-2 max-w-xs" title={msg}>
            {msg}
          </span>
        );
      },
    },
    {
      id: "stackTrace",
      header: "",
      cell: info => <ExpandableRow log={info.row.original} />,
    },
  ];

  const toolbar = (
    <div className="flex flex-col gap-2">
      {/* Log level tabs */}
      <div className="flex items-center gap-1">
        {LOG_LEVELS.map(lvl => (
          <button
            key={lvl.value}
            onClick={() => applyLogLevel(lvl.value)}
            data-tagid={`button-exception-logs-level-${lvl.value}`}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors
              ${logLevel === lvl.value
                ? lvl.value === "exception"
                  ? "bg-destructive text-destructive-foreground"
                  : lvl.value === "info"
                  ? "bg-blue-500 text-white"
                  : "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
          >
            {lvl.label}
          </button>
        ))}
      </div>

      {/* Search + module + date range */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search path / exception…"
            value={search}
            onChange={e => applySearch(e.target.value)}
            className="pl-8 h-8 w-56 text-sm"
            data-tagid="input-exception-logs-search"
          />
        </div>

        {/* Module filter */}
        <select
          value={module}
          onChange={e => applyModule(e.target.value)}
          className="h-8 rounded-md border border-input bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          data-tagid="select-exception-logs-module"
        >
          {MODULES.map(m => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>

        {/* Date range */}
        <Input
          type="date"
          value={from}
          onChange={e => applyFrom(e.target.value)}
          className="h-8 w-36 text-xs"
          title="From date"
          data-tagid="input-exception-logs-date-from"
        />
        <span className="text-xs text-muted-foreground">to</span>
        <Input
          type="date"
          value={to}
          onChange={e => applyTo(e.target.value)}
          className="h-8 w-36 text-xs"
          title="To date"
          data-tagid="input-exception-logs-date-to"
        />

        {/* Clear filters */}
        {(search || from || to || module || logLevel !== "all") && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-muted-foreground"
            data-tagid="button-exception-logs-clear"
            onClick={() => { applySearch(""); applyFrom(""); applyTo(""); applyModule(""); applyLogLevel("all"); }}
          >
            Clear
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Exception Logs</h1>
          {!isLoading && (
            <p className="text-sm text-muted-foreground mt-0.5">{total.toLocaleString()} total records</p>
          )}
        </div>
      </div>

      <DataTable
        title="Exception Logs"
        columns={columns}
        data={items}
        isLoading={isLoading}
        getRowId={row => String(row.id)}
        toolbar={toolbar}
        onRefresh={refetch}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              data-tagid="button-exception-logs-prev"
              onClick={() => setPage(p => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              data-tagid="button-exception-logs-next"
              onClick={() => setPage(p => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
