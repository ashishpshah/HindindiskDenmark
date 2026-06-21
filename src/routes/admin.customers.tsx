import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, Search, ChevronDown, ChevronUp, ShoppingBag, CalendarCheck } from "lucide-react";
import { useAdminCustomers, useAdminCustomerDetail } from "@/hooks/useAdminCustomers";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/admin/customers")({
  component: AdminCustomers,
});

function AdminCustomers() {
  const [search,   setSearch]   = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);

  const { data: customers = [], isLoading } = useAdminCustomers(search || undefined);
  const { data: detail, isLoading: detailLoading } = useAdminCustomerDetail(expanded);

  const toggle = (id: number) => setExpanded((prev) => (prev === id ? null : id));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-bold">Customers</h1>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or email…"
            className="pl-9"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground py-10">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading customers…
        </div>
      ) : customers.length === 0 ? (
        <div className="rounded-2xl border bg-card p-10 text-center text-muted-foreground">
          No customers found.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-card shadow-soft">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                {["Name", "Email", "Phone", "Joined", "Orders", "Reservations", "Total Spend", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {customers.map((c) => (
                <>
                  <tr key={c.id} className="hover:bg-muted/30 transition">
                    <td className="px-4 py-3 font-medium">{c.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.email}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.phone || "—"}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(c.createdAt).toLocaleDateString("en-DK", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <ShoppingBag className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{c.orderCount}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <CalendarCheck className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{c.reservationCount}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-primary">{c.totalSpend.toFixed(0)} DKK</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggle(c.id)}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition"
                      >
                        {expanded === c.id ? <><ChevronUp className="h-3.5 w-3.5" /> Hide</> : <><ChevronDown className="h-3.5 w-3.5" /> Orders</>}
                      </button>
                    </td>
                  </tr>

                  {expanded === c.id && (
                    <tr key={`${c.id}-detail`} className="bg-muted/10">
                      <td colSpan={8} className="px-8 py-4">
                        {detailLoading ? (
                          <div className="flex items-center gap-2 text-muted-foreground text-xs">
                            <Loader2 className="h-4 w-4 animate-spin" /> Loading orders…
                          </div>
                        ) : !detail || detail.orders.length === 0 ? (
                          <div className="text-xs text-muted-foreground">No orders yet.</div>
                        ) : (
                          <div className="space-y-2">
                            {detail.orders.map((o) => (
                              <div key={o.id} className="flex items-center justify-between rounded-lg border bg-card px-4 py-2 text-sm">
                                <div className="flex items-center gap-4">
                                  <span className="font-mono text-xs text-muted-foreground">#{o.id}</span>
                                  <span className="text-muted-foreground">{o.branchName.replace("Hind Indisk ", "")}</span>
                                  <span className="text-muted-foreground">{o.orderType}</span>
                                  <span className="text-xs text-muted-foreground">{o.itemCount} item{o.itemCount !== 1 ? "s" : ""}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                    o.status === "Completed"  ? "bg-green-100 text-green-700"  :
                                    o.status === "Cancelled"  ? "bg-red-100 text-red-700"      :
                                    o.status === "Preparing"  ? "bg-amber-100 text-amber-700"  :
                                    "bg-blue-100 text-blue-700"
                                  }`}>{o.status}</span>
                                  <span className="font-semibold">{o.total.toFixed(0)} DKK</span>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(o.createdAt).toLocaleDateString("en-DK", { day: "2-digit", month: "short" })}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
