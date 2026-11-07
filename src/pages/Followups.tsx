import { useEffect, useState, useCallback } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { API_BASE_URL } from "@/app/config";
import { getPatientsDb } from "@/app/patients";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2, Search, CalendarClock } from "lucide-react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Followup {
  followup_id: string | number;
  patient_code: string;
  patient_name?: string;
  followup_date: string;
  priority: "routine" | "high" | "urgent" | "low" | "medium" | string;
  clinician_note?: string;
  status?: string;
}

interface Patient {
  patient_code: string;
  name: string;
}

type Priority = "routine" | "high" | "urgent" | "low" | "medium";

const PRIORITY_RANGES = [
  { label: "Today",      value: "today" },
  { label: "This week",  value: "week" },
  { label: "This month", value: "month" },
  { label: "All",        value: "all" },
];

const PRIORITY_COLORS: Record<string, { color: string; bg: string }> = {
  urgent:  { color: "#ef4444", bg: "rgba(239,68,68,0.15)" },
  high:    { color: "#f97316", bg: "rgba(249,115,22,0.15)" },
  medium:  { color: "#f59e0b", bg: "rgba(245,158,11,0.15)" },
  routine: { color: "#3b82f6", bg: "rgba(59,130,246,0.15)" },
  low:     { color: "#22c55e", bg: "rgba(34,197,94,0.15)" },
};

function fmtDate(s?: string) {
  if (!s) return "—";
  try { return new Date(s).toLocaleDateString("en-GB"); } catch { return s; }
}

function PriorityBadge({ priority }: { priority: string }) {
  const meta = PRIORITY_COLORS[priority?.toLowerCase()] ?? { color: "#94a3b8", bg: "rgba(148,163,184,0.1)" };
  return (
    <span style={{
      display: "inline-block", padding: "2px 10px", borderRadius: 99,
      fontSize: 11, fontWeight: 600, color: meta.color, background: meta.bg,
      textTransform: "capitalize",
    }}>
      {priority}
    </span>
  );
}

// ─── API helpers ──────────────────────────────────────────────────────────────

async function getUpcoming(params?: { limit?: number }): Promise<Followup[]> {
  const qs = new URLSearchParams();
  if (params?.limit) qs.append("limit", String(params.limit));
  const url = qs.toString() ? `${API_BASE_URL}/followups/upcoming?${qs}` : `${API_BASE_URL}/followups/upcoming`;
  const res = await fetchWithAuth(url);
  if (!res.ok) throw new Error("Failed to load follow-ups");
  return res.json();
}

async function createFollowup(data: Omit<Followup, "followup_id">): Promise<Followup> {
  const res = await fetchWithAuth(`${API_BASE_URL}/followups/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create follow-up");
  return res.json();
}

async function updateFollowup(id: string | number, data: Partial<Followup>): Promise<Followup> {
  const res = await fetchWithAuth(`${API_BASE_URL}/followups/${encodeURIComponent(String(id))}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update follow-up");
  return res.json();
}

async function deleteFollowup(id: string | number): Promise<void> {
  const res = await fetchWithAuth(`${API_BASE_URL}/followups/${encodeURIComponent(String(id))}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete follow-up");
}

// ─── Empty form ───────────────────────────────────────────────────────────────

const emptyForm = {
  patient_code: "",
  followup_date: new Date().toISOString().split("T")[0],
  priority: "routine" as Priority,
  clinician_note: "",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function Followups() {
  const [followups, setFollowups] = useState<Followup[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [rangeFilter, setRangeFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  // Dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Delete
  const [deleteId, setDeleteId] = useState<string | number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [fus, pts] = await Promise.all([
        getUpcoming({ limit: 200 }),
        getPatientsDb().then((d: any) => Array.isArray(d) ? d : d?.patients ?? []).catch(() => []),
      ]);
      setFollowups(Array.isArray(fus) ? fus : []);
      setPatients(pts);
    } catch {
      setFollowups([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Filter
  const now = new Date();
  const filtered = followups.filter((f) => {
    const date = new Date(f.followup_date);
    if (rangeFilter === "today") {
      const today = new Date(); today.setHours(0,0,0,0);
      const todayEnd = new Date(); todayEnd.setHours(23,59,59,999);
      if (date < today || date > todayEnd) return false;
    } else if (rangeFilter === "week") {
      const end = new Date(); end.setDate(end.getDate() + 7);
      if (date < now || date > end) return false;
    } else if (rangeFilter === "month") {
      const end = new Date(); end.setMonth(end.getMonth() + 1);
      if (date < now || date > end) return false;
    }
    if (priorityFilter !== "all" && f.priority !== priorityFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        (f.patient_code?.toLowerCase().includes(q)) ||
        (f.patient_name?.toLowerCase().includes(q)) ||
        (f.clinician_note?.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormError("");
    setDialogOpen(true);
  };

  const openEdit = (f: Followup) => {
    setEditingId(f.followup_id);
    setForm({
      patient_code: f.patient_code,
      followup_date: f.followup_date ? f.followup_date.split("T")[0] : "",
      priority: f.priority as Priority,
      clinician_note: f.clinician_note || "",
    });
    setFormError("");
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.patient_code) { setFormError("Patient is required"); return; }
    if (!form.followup_date) { setFormError("Date is required"); return; }
    if (!form.priority) { setFormError("Priority is required"); return; }

    // Validate not past date
    const chosen = new Date(form.followup_date);
    chosen.setHours(0,0,0,0);
    const today = new Date(); today.setHours(0,0,0,0);
    if (chosen < today) { setFormError("Cannot select past dates"); return; }

    setSubmitting(true);
    setFormError("");
    try {
      if (editingId != null) {
        await updateFollowup(editingId, form);
        toast.success("Follow-up updated");
      } else {
        await createFollowup({ ...form, followup_date: new Date(form.followup_date).toISOString() });
        toast.success("Follow-up scheduled");
      }
      setDialogOpen(false);
      load();
    } catch (err: any) {
      setFormError(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteFollowup(deleteId);
      setDeleteId(null);
      toast.success("Follow-up deleted");
      load();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  const patientName = (code: string) =>
    patients.find((p) => p.patient_code === code)?.name || code;

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <CalendarClock className="h-6 w-6 text-primary" />
              Upcoming Follow-Ups
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Follow-up monitoring of known MCI/dementia patients
            </p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Schedule New Follow-Up
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search follow-ups..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={rangeFilter} onValueChange={setRangeFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Date range" />
            </SelectTrigger>
            <SelectContent>
              {PRIORITY_RANGES.map((r) => (
                <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All priorities</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="routine">Routine</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground ml-auto">
            {filtered.length} follow-up{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Table */}
        <div className="clinical-card overflow-hidden p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="font-semibold">Patient</TableHead>
                <TableHead className="font-semibold">Follow-up Date</TableHead>
                <TableHead className="font-semibold">Priority</TableHead>
                <TableHead className="font-semibold">Clinician Note</TableHead>
                <TableHead className="font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {[1,2,3,4,5].map((j) => (
                      <TableCell key={j}>
                        <div className="h-4 w-full bg-muted/40 rounded animate-pulse" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                    {followups.length === 0 ? "No follow-ups found" : "No follow-ups match your filters"}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((f) => (
                  <TableRow key={f.followup_id} className="data-row">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{patientName(f.patient_code)}</span>
                        <span className="text-xs text-muted-foreground">{f.patient_code}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{fmtDate(f.followup_date)}</TableCell>
                    <TableCell><PriorityBadge priority={f.priority} /></TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                      {f.clinician_note || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(f)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700"
                          onClick={() => setDeleteId(f.followup_id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Follow-Up" : "Schedule New Follow-Up"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {formError && <p className="text-sm text-red-500">{formError}</p>}
            <div className="space-y-1">
              <Label>Patient *</Label>
              <Select
                value={form.patient_code}
                onValueChange={(v) => setForm((f) => ({ ...f, patient_code: v }))}
                disabled={!!editingId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a patient" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((p) => (
                    <SelectItem key={p.patient_code} value={p.patient_code}>
                      {p.name} ({p.patient_code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Follow-up Date *</Label>
              <Input
                type="date"
                value={form.followup_date}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setForm((f) => ({ ...f, followup_date: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Priority *</Label>
              <Select value={form.priority} onValueChange={(v) => setForm((f) => ({ ...f, priority: v as Priority }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="routine">Routine</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Clinician Note</Label>
              <Input
                value={form.clinician_note}
                onChange={(e) => setForm((f) => ({ ...f, clinician_note: e.target.value }))}
                placeholder="Optional note for the follow-up..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Saving…" : editingId ? "Save Changes" : "Schedule Follow-Up"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Follow-Up</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this follow-up? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
