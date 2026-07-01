import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search, ChevronDown, ChevronRight, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import { useExceptionLogs, type ExceptionLogDto } from "@/hooks/useExceptionLogs";
import { useAdminAuth } from "@/context/AdminAuthContext";

export const Route = createFileRoute("/admin/exception-logs")({ component: ExceptionLogsPage });

// ── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 50;

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
  return (
    <div>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1 text-xs text-primary hover:underline"
      >
        {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        {open ? "Hide" : "Stack trace"}
      </button>
      {open && log.stackTrace && (
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

  const [page,   setPage]   = useState(1);
  const [search, setSearch] = useState("");
  const [from,   setFrom]   = useState("");
  const [to,     setTo]     = useState("");
  const [module, setModule] = useState("");

  // Reset to page 1 whenever filters change
  const applySearch = (v: string) => { setSearch(v); setPage(1); };
  const applyFrom   = (v: string) => { setFrom(v);   setPage(1); };
  const applyTo     = (v: string) => { setTo(v);     setPage(1); };
  const applyModule = (v: string) => { setModule(v); setPage(1); };

  const { data, isLoading, refetch } = useExceptionLogs({
    page,
    pageSize: PAGE_SIZE,
    search:   search || undefined,
    from:     from   || undefined,
    to:       to     || undefined,
    module:   module || undefined,
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
          {new Date(info.getValue<string>()).toLocaleString("da-DK", {
            timeZone: "Europe/Copenhagen",
            day: "2-digit", month: "short", year: "numeric",
            hour: "2-digit", minute: "2-digit", second: "2-digit",
          })}
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
        const full  = info.getValue<string>();
        const short = full.split(".").at(-1) ?? full;
        return <span className="text-xs font-medium text-destructive" title={full}>{short}</span>;
      },
    },
    {
      accessorKey: "exceptionMessage",
      header: "Message",
      cell: info => (
        <span className="text-xs text-muted-foreground line-clamp-2 max-w-xs" title={info.getValue<string>()}>
          {info.getValue<string>()}
        </span>
      ),
    },
    {
      accessorKey: "userId",
      header: "User",
      cell: info => (
        <span className="text-xs text-muted-foreground tabular-nums">
          {info.getValue<number | null>() ?? "—"}
        </span>
      ),
    },
    {
      accessorKey: "clientIp",
      header: "IP",
      cell: info => (
        <span className="font-mono text-xs text-muted-foreground">
          {info.getValue<string | null>() ?? "—"}
        </span>
      ),
    },
    {
      id: "stackTrace",
      header: "",
      cell: info => <ExpandableRow log={info.row.original} />,
    },
  ];

  const toolbar = (
    <div className="flex flex-wrap items-center gap-2">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Search path / exception…"
          value={search}
          onChange={e => applySearch(e.target.value)}
          className="pl-8 h-8 w-56 text-sm"
        />
      </div>

      {/* Module filter */}
      <select
        value={module}
        onChange={e => applyModule(e.target.value)}
        className="h-8 rounded-md border border-input bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
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
      />
      <span className="text-xs text-muted-foreground">to</span>
      <Input
        type="date"
        value={to}
        onChange={e => applyTo(e.target.value)}
        className="h-8 w-36 text-xs"
        title="To date"
      />

      {/* Clear filters */}
      {(search || from || to || module) && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs text-muted-foreground"
          onClick={() => { applySearch(""); applyFrom(""); applyTo(""); applyModule(""); }}
        >
          Clear
        </Button>
      )}
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
              onClick={() => setPage(p => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
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
