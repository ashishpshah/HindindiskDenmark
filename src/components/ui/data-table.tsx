import {
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
  type PaginationState,
  type Row,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useState, useCallback, useRef } from "react";
import {
  ArrowUpDown, ArrowUp, ArrowDown, Search, Filter, Eye, EyeOff,
  Printer, Download, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Loader2, RefreshCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

// ─── Re-export so pages only need one import ──────────────────────────────────
export type { ColumnDef, Row };

// ─── Props ────────────────────────────────────────────────────────────────────
interface DataTableProps<TData> {
  title:     string;
  columns:   ColumnDef<TData, unknown>[];
  data:      TData[];
  isLoading?: boolean;
  toolbar?:  React.ReactNode;       // extra filters rendered in toolbar
  expandedRow?: (row: Row<TData>) => React.ReactNode;
  getRowId?: (row: TData) => string; // stable row identity for expand tracking
  onRefresh?: () => void;
  printTitle?: string;
}

const PAGE_SIZES = [10, 20, 50, 100];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function escCsv(v: unknown): string {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function DataTable<TData>({
  title, columns, data, isLoading, toolbar, expandedRow, getRowId, onRefresh, printTitle,
}: DataTableProps<TData>) {
  const [sorting,        setSorting]        = useState<SortingState>([]);
  const [columnFilters,  setColumnFilters]  = useState<ColumnFiltersState>([]);
  const [globalFilter,   setGlobalFilter]   = useState("");
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [pagination,     setPagination]     = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [showFilters,    setShowFilters]    = useState(false);
  const [expandedId,     setExpandedId]     = useState<string | null>(null);

  const tableRef = useRef<HTMLDivElement>(null);

  // Prepend Sr.No. column
  const srCol: ColumnDef<TData, unknown> = {
    id: "__sr",
    header: "Sr.",
    enableSorting: false,
    enableColumnFilter: false,
    size: 48,
    cell: ({ row, table }) => {
      const pageIndex = table.getState().pagination.pageIndex;
      const pageSize  = table.getState().pagination.pageSize;
      return (
        <span className="text-xs text-muted-foreground tabular-nums">
          {pageIndex * pageSize + row.index + 1}
        </span>
      );
    },
  };

  const allColumns = [srCol, ...columns];

  const table = useReactTable({
    data,
    columns: allColumns,
    state:   { sorting, columnFilters, globalFilter, columnVisibility, pagination },
    getRowId,
    onSortingChange:          setSorting,
    onColumnFiltersChange:    setColumnFilters,
    onGlobalFilterChange:     setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange:       setPagination,
    getCoreRowModel:       getCoreRowModel(),
    getSortedRowModel:     getSortedRowModel(),
    getFilteredRowModel:   getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableMultiSort: true,
    enableSortingRemoval: true,
  });

  // ── CSV Export ──────────────────────────────────────────────────────────────
  const handleExport = useCallback(() => {
    const visibleCols = table.getVisibleLeafColumns().filter(c => c.id !== "__sr");
    const headers = visibleCols.map(c => {
      const h = c.columnDef.header;
      return typeof h === "string" ? h : c.id;
    });
    const rows = table.getFilteredRowModel().rows.map(row =>
      visibleCols.map(col => {
        const val = row.getValue(col.id);
        return escCsv(val);
      })
    );
    const csv = [headers.map(escCsv), ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `${(printTitle ?? title).toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [table, title, printTitle]);

  // ── Print ───────────────────────────────────────────────────────────────────
  const handlePrint = useCallback(() => {
    const printContent = tableRef.current?.innerHTML ?? "";
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head>
      <title>${printTitle ?? title}</title>
      <style>
        body { font-family: system-ui, sans-serif; font-size: 12px; margin: 20px; }
        h1 { font-size: 16px; margin-bottom: 12px; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #f3f4f6; font-weight: 600; text-align: left; padding: 6px 10px; border: 1px solid #e5e7eb; }
        td { padding: 5px 10px; border: 1px solid #e5e7eb; }
        tr:nth-child(even) { background: #fafafa; }
        .no-print { display: none !important; }
        @media print { button, input, select { display: none !important; } }
      </style>
    </head><body>
      <h1>${printTitle ?? title}</h1>
      ${printContent}
    </body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 300);
  }, [title, printTitle]);

  const filteredCount = table.getFilteredRowModel().rows.length;
  const pageCount     = table.getPageCount();

  return (
    <div className="space-y-4">
      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Global search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search all columns…"
            value={globalFilter}
            onChange={(e) => { setGlobalFilter(e.target.value); setPagination(p => ({ ...p, pageIndex: 0 })); }}
            className="pl-8 h-8 w-52 text-sm"
          />
        </div>

        {/* Extra toolbar (branch/status selects from parent) */}
        {toolbar && <div className="flex flex-wrap items-center gap-2">{toolbar}</div>}

        <div className="ml-auto flex items-center gap-2">
          {/* Filter row toggle */}
          <Button
            size="sm" variant={showFilters ? "default" : "outline"}
            className={`h-8 text-xs ${showFilters ? "gradient-primary text-primary-foreground" : ""}`}
            onClick={() => setShowFilters(v => !v)}
          >
            <Filter className="mr-1.5 h-3.5 w-3.5" />
            Filters
          </Button>

          {/* Column visibility */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" className="h-8 text-xs">
                <Eye className="mr-1.5 h-3.5 w-3.5" /> Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuLabel>Show / hide</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {table.getAllLeafColumns()
                .filter(c => c.id !== "__sr")
                .map(col => (
                  <DropdownMenuCheckboxItem
                    key={col.id}
                    checked={col.getIsVisible()}
                    onCheckedChange={val => col.toggleVisibility(val)}
                  >
                    {typeof col.columnDef.header === "string"
                      ? col.columnDef.header
                      : col.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Export CSV */}
          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={handleExport}>
            <Download className="mr-1.5 h-3.5 w-3.5" /> Export
          </Button>

          {/* Print */}
          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={handlePrint}>
            <Printer className="mr-1.5 h-3.5 w-3.5" /> Print
          </Button>

          {/* Refresh */}
          {onRefresh && (
            <Button size="sm" variant="ghost" className="h-8 text-xs text-muted-foreground" onClick={onRefresh}>
              <RefreshCcw className="mr-1 h-3.5 w-3.5" /> Refresh
            </Button>
          )}
        </div>
      </div>

      {/* ── Table ───────────────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading…
        </div>
      ) : (
        <div ref={tableRef} className="overflow-x-auto rounded-2xl border bg-card shadow-soft">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              {/* Header row */}
              {table.getHeaderGroups().map(hg => (
                <tr key={hg.id}>
                  {hg.headers.map(header => {
                    const canSort = header.column.getCanSort();
                    const sorted  = header.column.getIsSorted();
                    return (
                      <th
                        key={header.id}
                        style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                        className={`px-3 py-3 text-left text-xs font-semibold text-muted-foreground select-none whitespace-nowrap
                          ${canSort ? "cursor-pointer hover:text-primary transition" : ""}`}
                        onClick={canSort
                          ? header.column.getToggleSortingHandler()
                          : undefined}
                        title={canSort ? "Click to sort · Shift+click for multi-sort" : undefined}
                      >
                        <span className="inline-flex items-center gap-1">
                          {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                          {canSort && (
                            sorted === "asc"  ? <ArrowUp   className="h-3 w-3 text-primary" /> :
                            sorted === "desc" ? <ArrowDown className="h-3 w-3 text-primary" /> :
                            <ArrowUpDown className="h-3 w-3 opacity-30" />
                          )}
                        </span>
                      </th>
                    );
                  })}
                </tr>
              ))}

              {/* Filter header row */}
              {showFilters && table.getHeaderGroups().map(hg => (
                <tr key={`${hg.id}-filter`} className="border-t bg-muted/20">
                  {hg.headers.map(header => {
                    const canFilter = header.column.getCanFilter();
                    return (
                      <th key={`f-${header.id}`} className="px-2 py-1.5">
                        {canFilter ? (
                          <Input
                            placeholder="Filter…"
                            value={(header.column.getFilterValue() as string) ?? ""}
                            onChange={e => {
                              header.column.setFilterValue(e.target.value || undefined);
                              setPagination(p => ({ ...p, pageIndex: 0 }));
                            }}
                            className="h-7 text-xs min-w-[60px]"
                          />
                        ) : null}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>

            <tbody className="divide-y">
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={allColumns.length} className="py-12 text-center text-sm text-muted-foreground">
                    No records found.
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map(row => {
                  const rowKey = row.id;
                  const isExpanded = expandedId === rowKey;
                  const expandedContent = isExpanded && expandedRow ? expandedRow(row) : null;
                  return [
                    <tr
                      key={rowKey}
                      className="hover:bg-muted/30 transition"
                      onClick={expandedRow ? () => setExpandedId(isExpanded ? null : rowKey) : undefined}
                      style={expandedRow ? { cursor: "pointer" } : undefined}
                    >
                      {row.getVisibleCells().map(cell => (
                        <td
                          key={cell.id}
                          className="px-3 py-2.5 align-middle"
                          onClick={["__actions", "__expand"].includes(cell.column.id) ? e => e.stopPropagation() : undefined}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>,
                    expandedContent != null ? (
                      <tr key={`${rowKey}-exp`} className="bg-muted/10">
                        <td colSpan={allColumns.length} className="px-6 py-4">
                          {expandedContent}
                        </td>
                      </tr>
                    ) : null,
                  ];
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Pagination ──────────────────────────────────────────────────────── */}
      {!isLoading && (
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>Rows per page</span>
            <Select
              value={String(pagination.pageSize)}
              onValueChange={v => setPagination({ pageIndex: 0, pageSize: Number(v) })}
            >
              <SelectTrigger className="h-7 w-16 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZES.map(n => (
                  <SelectItem key={n} value={String(n)} className="text-xs">{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span>
              {filteredCount === data.length
                ? `${filteredCount} total`
                : `${filteredCount} of ${data.length}`}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <span className="mr-2">
              Page {pagination.pageIndex + 1} of {pageCount || 1}
            </span>
            <Button size="sm" variant="outline" className="h-7 w-7 p-0"
              onClick={() => setPagination(p => ({ ...p, pageIndex: 0 }))}
              disabled={!table.getCanPreviousPage()}>
              <ChevronsLeft className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" variant="outline" className="h-7 w-7 p-0"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}>
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" variant="outline" className="h-7 w-7 p-0"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" variant="outline" className="h-7 w-7 p-0"
              onClick={() => setPagination(p => ({ ...p, pageIndex: pageCount - 1 }))}
              disabled={!table.getCanNextPage()}>
              <ChevronsRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Reusable badge helper ────────────────────────────────────────────────────
export function StatusBadge({
  value, colorMap, labelMap,
}: {
  value: string;
  colorMap?: Record<string, string>;
  labelMap?: Record<string, string>;
}) {
  const label = labelMap?.[value] ?? value;
  const color = colorMap?.[value] ?? "bg-muted text-muted-foreground";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${color}`}>
      {label}
    </span>
  );
}

// ─── Active / Inactive badge shortcut ────────────────────────────────────────
export function ActiveBadge({ active }: { active: boolean }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold
      ${active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
      {active ? "Active" : "Inactive"}
    </span>
  );
}

// ─── Action buttons helper ────────────────────────────────────────────────────
export function ActionButtons({
  onEdit, onDelete, editLabel = "Edit", deleteDisabled,
}: {
  onEdit?: () => void;
  onDelete?: () => void;
  editLabel?: string;
  deleteDisabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {onEdit && (
        <button
          onClick={onEdit}
          className="rounded-lg border px-2.5 py-1 text-xs font-medium hover:bg-accent transition"
        >
          {editLabel}
        </button>
      )}
      {onDelete && (
        <button
          onClick={onDelete}
          disabled={deleteDisabled}
          className="rounded-lg border border-destructive/30 px-2.5 py-1 text-xs font-medium text-destructive hover:bg-destructive/10 transition disabled:opacity-50"
        >
          Delete
        </button>
      )}
    </div>
  );
}
