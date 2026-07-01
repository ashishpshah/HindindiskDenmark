import { createFileRoute, useNavigate, Link, useRouterState } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Loader2, Check, Calendar, Clock } from "lucide-react";
import { toast } from "sonner";
import { useAdminBranches } from "@/hooks/useAdminBranches";
import { useUpdateBranch } from "@/hooks/useUpdateBranch";
import { useSchedule, useUpsertSchedule, type DayScheduleDto } from "@/hooks/useSchedule";
import { FormPage } from "@/components/admin/FormPage";
import { BranchFields, type BranchForm, EMPTY_BRANCH } from "./admin.branches.new";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/admin/branches/$branchId")({ component: BranchEditPage });

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

type ScheduleRow = {
  dayOfWeek: number;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
  slotIntervalMinutes: number;
  maxOrdersPerSlot: number;
  maxReservationsPerSlot: number;
};

function buildDefaultRows(data: DayScheduleDto[]): ScheduleRow[] {
  return DAY_NAMES.map((_, day) => {
    const existing = data.find(d => d.dayOfWeek === day);
    return existing
      ? { ...existing, dayOfWeek: day, isOpen: true }
      : { dayOfWeek: day, isOpen: false, openTime: "11:00", closeTime: "22:00",
          slotIntervalMinutes: 30, maxOrdersPerSlot: 10, maxReservationsPerSlot: 5 };
  });
}

function BranchEditPage() {
  const navigate      = useNavigate();
  const { branchId }  = Route.useParams();
  const branchIdNum   = Number(branchId);

  const hash = useRouterState({ select: s => s.location.hash });
  const defaultTab = hash === "#schedule" ? "schedule" : "info";

  const { data: branches = [], isLoading } = useAdminBranches();
  const updateBranch = useUpdateBranch();
  const { data: scheduleData = [], isLoading: scheduleLoading } = useSchedule(branchIdNum);
  const upsertSchedule = useUpsertSchedule(branchIdNum);

  const branch = branches.find(b => String(b.id) === branchId);

  // ── Branch Info form ───────────────────────────────────────────────────────
  const [form, setForm] = useState<BranchForm>(EMPTY_BRANCH);

  useEffect(() => {
    if (!branch) return;
    setForm({
      name:           branch.name,
      addressLine1:   branch.addressLine1,
      addressLine2:   branch.addressLine2 ?? "",
      city:           branch.city,
      postalCode:     branch.postalCode,
      country:        branch.country,
      phone:          branch.phone,
      email:          branch.email,
      googleMapsLink:   branch.googleMapsLink,
      imageUrl:         branch.imageUrl,
      rating:           String(branch.rating),
      reviewCount:      String(branch.reviewCount),
      deliveryEnabled:    branch.deliveryEnabled,
      pickupEnabled:      branch.pickupEnabled,
      deliveryFee:        String(branch.deliveryFee),
      deliveryFeeEnabled: branch.deliveryFeeEnabled,
      maxAdvanceDays:     String(branch.maxAdvanceDays),
    });
  }, [branch]);

  const f = (field: keyof BranchForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSave = async () => {
    if (!form.name.trim() || !form.addressLine1.trim()) return;
    try {
      await updateBranch.mutateAsync({
        id: branchIdNum,
        name: form.name, addressLine1: form.addressLine1,
        addressLine2: form.addressLine2 || undefined,
        city: form.city, postalCode: form.postalCode, country: form.country,
        phone: form.phone, email: form.email, googleMapsLink: form.googleMapsLink,
        imageUrl: form.imageUrl,
        rating: parseFloat(form.rating) || 5.0,
        reviewCount: parseInt(form.reviewCount) || 0,
        deliveryEnabled:    form.deliveryEnabled,
        pickupEnabled:      form.pickupEnabled,
        deliveryFee:        parseFloat(form.deliveryFee) || 39,
        deliveryFeeEnabled: form.deliveryFeeEnabled,
        maxAdvanceDays:     parseInt(form.maxAdvanceDays) || 0,
      });
      toast.success(`${form.name} updated.`);
      navigate({ to: "/admin/branches" });
    } catch (e) { toast.error((e as Error).message || "Failed to update branch."); }
  };

  // ── Schedule rows ──────────────────────────────────────────────────────────
  const [scheduleRows, setScheduleRows] = useState<ScheduleRow[]>([]);

  useEffect(() => {
    setScheduleRows(buildDefaultRows(scheduleData));
  }, [scheduleData]);

  const updateRow = (day: number, patch: Partial<ScheduleRow>) =>
    setScheduleRows(prev => prev.map(r => r.dayOfWeek === day ? { ...r, ...patch } : r));

  const handleSaveSchedule = async () => {
    const openDays = scheduleRows
      .filter(r => r.isOpen)
      .map(({ dayOfWeek, openTime, closeTime, slotIntervalMinutes, maxOrdersPerSlot, maxReservationsPerSlot }) => ({
        dayOfWeek, openTime, closeTime, slotIntervalMinutes, maxOrdersPerSlot, maxReservationsPerSlot,
      }));
    try {
      await upsertSchedule.mutateAsync(openDays);
      toast.success("Schedule saved.");
    } catch (e) { toast.error((e as Error).message || "Failed to save schedule."); }
  };

  if (isLoading) return (
    <div className="flex items-center gap-2 text-muted-foreground py-16">
      <Loader2 className="h-5 w-5 animate-spin" /> Loading…
    </div>
  );

  if (!branch) return <div className="py-16 text-center text-muted-foreground">Branch not found.</div>;

  return (
    <FormPage
      title={`Edit — ${branch.name}`}
      subtitle="Update location details and weekly schedule"
      backTo="/admin/branches"
      maxWidth="max-w-3xl"
    >
      <Tabs defaultValue={defaultTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="info">Branch Info</TabsTrigger>
          <TabsTrigger value="schedule">
            <Clock className="h-3.5 w-3.5 mr-1.5" /> Schedule
          </TabsTrigger>
        </TabsList>

        {/* ── Branch Info tab ───────────────────────────────────────────── */}
        <TabsContent value="info">
          <BranchFields form={form} f={f}
            onImageChange={url => setForm(prev => ({ ...prev, imageUrl: url }))}
            onSave={handleSave} isSaving={updateBranch.isPending}
            onCancel={() => navigate({ to: "/admin/branches" })} />
        </TabsContent>

        {/* ── Schedule tab ──────────────────────────────────────────────── */}
        <TabsContent value="schedule">
          {scheduleLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground py-8">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading schedule…
            </div>
          ) : (
            <div className="space-y-6">
              <p className="text-sm text-muted-foreground">
                Set opening hours for each day of the week. Days toggled off are treated as
                closed every week. Changes take effect immediately for new bookings.
              </p>

              <div className="rounded-xl border divide-y">
                {scheduleRows.map(row => (
                  <div key={row.dayOfWeek}
                    className={`grid grid-cols-[140px_1fr] gap-4 p-4 items-start
                      ${!row.isOpen ? "opacity-50" : ""}`}>

                    {/* Day toggle */}
                    <div className="flex items-center gap-3 pt-1">
                      <Switch
                        checked={row.isOpen}
                        onCheckedChange={v => updateRow(row.dayOfWeek, { isOpen: v })}
                      />
                      <span className="text-sm font-medium">{DAY_NAMES[row.dayOfWeek]}</span>
                    </div>

                    {/* Time + capacity fields */}
                    {row.isOpen ? (
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Open</Label>
                          <Input type="time" value={row.openTime}
                            onChange={e => updateRow(row.dayOfWeek, { openTime: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Close</Label>
                          <Input type="time" value={row.closeTime}
                            onChange={e => updateRow(row.dayOfWeek, { closeTime: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Slot every (min)</Label>
                          <Input type="number" min={15} max={120} step={15} value={row.slotIntervalMinutes}
                            onChange={e => updateRow(row.dayOfWeek, { slotIntervalMinutes: Number(e.target.value) })} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Max orders/slot</Label>
                          <Input type="number" min={1} value={row.maxOrdersPerSlot}
                            onChange={e => updateRow(row.dayOfWeek, { maxOrdersPerSlot: Number(e.target.value) })} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Max reservations/slot</Label>
                          <Input type="number" min={1} value={row.maxReservationsPerSlot}
                            onChange={e => updateRow(row.dayOfWeek, { maxReservationsPerSlot: Number(e.target.value) })} />
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground pt-1">Closed</p>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <Link
                  to="/admin/branches/$branchId/closures"
                  params={{ branchId }}
                  className="text-sm text-primary hover:underline flex items-center gap-1.5"
                >
                  <Calendar className="h-3.5 w-3.5" />
                  Manage date-specific closures →
                </Link>

                <Button
                  className="gradient-primary text-primary-foreground"
                  onClick={handleSaveSchedule}
                  disabled={upsertSchedule.isPending}
                >
                  {upsertSchedule.isPending
                    ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    : <Check className="mr-1.5 h-4 w-4" />}
                  Save Schedule
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </FormPage>
  );
}
