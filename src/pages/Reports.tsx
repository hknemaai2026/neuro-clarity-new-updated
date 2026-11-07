import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  DateRangePicker,
  DateRange,
} from "@/components/ui/date-range-picker";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
  getPatientsDb,
  getPatientHistory,
  createPatient,
  editPatient,
  deletePatient,
  PatientPayload,
} from "@/app/patients";
import { API_BASE_URL } from "@/app/config";
import { toast } from "sonner";
import { Eye, Download, Pencil, Trash2, TrendingUp, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface Patient {
  hospital_id?: number;
  patient_code: string;
  name: string;
  age: number;
  gender: string;
  risk_band?: string;
  risk_percent?: number;
  latestEEGDate?: string;
  latestEEGQuality?: any;
  latestRiskLevel?: string;
  latestProbability?: number;
  latestScore?: any;
  prescription_path?: string;
  prescription_url?: string;
}

const emptyForm: PatientPayload = {
  hospital_id: 1,
  patient_code: "",
  name: "",
  age: 0,
  gender: "",
};

function getRiskBadgeVariantByBand(
  band?: string
): "riskHigh" | "riskElevated" | "riskModerate" | "riskLow" | "secondary" {
  if (!band) return "secondary";
  const t = band.toLowerCase();
  if (t.includes("high")) return "riskHigh";
  if (t.includes("elevated")) return "riskElevated";
  if (t.includes("moderate") || t.includes("mod")) return "riskModerate";
  if (t.includes("low")) return "riskLow";
  return "secondary";
}

function getRiskCategory(percent?: number): "high" | "elevated" | "moderate" | "low" {
  if (percent == null) return "low";
  if (percent >= 70) return "high";
  if (percent >= 55) return "elevated";
  if (percent >= 40) return "moderate";
  return "low";
}

function getRiskBadgeVariantByPercent(
  percent?: number
): "riskHigh" | "riskElevated" | "riskModerate" | "riskLow" | "secondary" {
  if (percent == null) return "secondary";
  switch (getRiskCategory(percent)) {
    case "high":
      return "riskHigh";
    case "elevated":
      return "riskElevated";
    case "moderate":
      return "riskModerate";
    case "low":
      return "riskLow";
    default:
      return "secondary";
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// PATIENT SCREENING SUMMARY TABLE COMPONENT (M9 in Live)
// ═════════════════════════════════════════════════════════════════════════════
interface PatientTableProps {
  patients: Patient[];
  selectedPatientId?: string;
  onEditPatient?: (p: Patient) => void;
  onDeletePatient?: (code: string) => void;
  onAddPatient?: () => void;
  loading?: boolean;
}

function PatientScreeningSummaryTable({
  patients,
  onEditPatient,
  onDeletePatient,
  onAddPatient,
  loading = false,
}: PatientTableProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState<DateRange>();
  const [page, setPage] = useState(1);
  const [localPatients, setLocalPatients] = useState<Patient[]>(patients ?? []);
  const pageSize = 5;

  const isDateInRange = (dateStr?: string) => {
    if (!dateStr) return true;
    try {
      const d = new Date(dateStr);
      if (dateRange?.from && d < dateRange.from) return false;
      if (dateRange?.to) {
        const toDate = new Date(dateRange.to);
        toDate.setHours(23, 59, 59, 999);
        if (d > toDate) return false;
      }
      return true;
    } catch {
      return true;
    }
  };

  useEffect(() => {
    if (patients.length > 0) {
      setLocalPatients(patients);
      if (typeof window !== "undefined") {
        sessionStorage.setItem("patientTableData", JSON.stringify(patients));
      }
      return;
    }
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("patientTableData");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) setLocalPatients(parsed);
        } catch {
          sessionStorage.removeItem("patientTableData");
        }
      }
    }
  }, [patients, loading]);

  const query = search.toLowerCase().trim();
  const filtered = (localPatients ?? []).filter((p) => {
    if (!isDateInRange(p.latestEEGDate)) return false;
    if (!query) return true;
    return [
      p.name,
      p.patient_code,
      p.risk_band,
      p.gender,
      p.latestEEGDate,
      p.latestRiskLevel,
    ]
      .filter(Boolean)
      .some((val) => String(val).toLowerCase().includes(query));
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  useEffect(() => {
    setPage(1);
  }, [search, dateRange]);

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const renderPagination = () => {
    const items = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i += 1) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              isActive={i === page}
              onClick={(e) => {
                e.preventDefault();
                setPage(i);
              }}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
    } else {
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);

      items.push(
        <PaginationItem key={1}>
          <PaginationLink
            isActive={page === 1}
            onClick={(e) => {
              e.preventDefault();
              setPage(1);
            }}
          >
            1
          </PaginationLink>
        </PaginationItem>
      );

      if (start > 2) {
        items.push(<PaginationEllipsis key="start-ellipsis" />);
      }

      for (let i = start; i <= end; i += 1) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              isActive={i === page}
              onClick={(e) => {
                e.preventDefault();
                setPage(i);
              }}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }

      if (end < totalPages - 1) {
        items.push(<PaginationEllipsis key="end-ellipsis" />);
      }

      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink
            isActive={page === totalPages}
            onClick={(e) => {
              e.preventDefault();
              setPage(totalPages);
            }}
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }
    return items;
  };

  const handleDownloadPrescription = async (patient: Patient) => {
    const url = patient.prescription_url || patient.prescription_path;
    if (url) {
      try {
        let fetchUrl: string;
        let res: Response;
        if (url.startsWith("http") && url.includes("storage.googleapis.com")) {
          fetchUrl = `${API_BASE_URL}/proxy-download?url=${encodeURIComponent(url)}`;
          res = await fetch(fetchUrl);
        } else if (url.startsWith("http")) {
          fetchUrl = url;
          res = await fetch(fetchUrl);
        } else {
          fetchUrl = `${API_BASE_URL}/${url.replace(/^\//, "")}`;
          res = await fetch(fetchUrl);
        }
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Failed to download prescription: ${res.status} ${text}`);
        }
        const blob = await res.blob();
        if (blob.size === 0) throw new Error("Downloaded prescription file is empty");
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = `prescription_${patient.patient_code}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(blobUrl);
      } catch (err: any) {
        try {
          if (url && url.startsWith("http")) {
            window.open(url, "_blank");
            alert("Prescription opened in new tab. Please save it manually.");
          } else {
            throw err;
          }
        } catch {
          alert(`Prescription download failed: ${err.message || "Unknown error"}`);
        }
      }
    }
  };

  const handleViewPrescription = (patient: Patient) => {
    const url = patient.prescription_url || patient.prescription_path;
    if (!url) return;
    const fullUrl = url.startsWith("http") ? url : `${API_BASE_URL}/${url.replace(/^\//, "")}`;
    window.open(fullUrl, "_blank");
  };

  return (
    <div className="clinical-card overflow-hidden p-0 relative">
      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white/50 dark:bg-slate-950/50 flex items-center justify-center z-50 rounded-lg backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2">
            <div className="relative w-8 h-8">
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-500 border-r-blue-500 animate-spin" />
            </div>
            <p className="text-sm text-muted-foreground font-medium">Loading patients...</p>
          </div>
        </div>
      )}

      {/* Header bar */}
      <div className="border-b border-border/70 bg-muted/80 px-4 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Patient Screening Summary</h3>
          <p className="text-sm text-muted-foreground">
            Overview of patient risk and screening status with quick access to history and trends.
          </p>
        </div>
        {onAddPatient && (
          <Button onClick={onAddPatient} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Patient
          </Button>
        )}
      </div>

      {/* Search & date filter bar */}
      <div className="border-b border-border/70 bg-background/80 px-4 py-4 space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search patients, ID, risk band..."
            className="max-w-sm"
          />
          <p className="text-sm text-muted-foreground">
            Showing {paginated.length} of {filtered.length} patients
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <DateRangePicker
            label="Screening date range"
            range={dateRange}
            onRangeChange={setDateRange}
            onClear={() => setDateRange(undefined)}
            placeholder="Choose a date range"
            className="sm:col-span-2 lg:col-span-3"
          />
        </div>
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30">
            <TableHead className="font-semibold">Patient Name</TableHead>
            <TableHead className="font-semibold">Age / Sex</TableHead>
            <TableHead className="font-semibold">Risk Percentage</TableHead>
            <TableHead className="font-semibold">Risk Level</TableHead>
            <TableHead className="font-semibold">Last Screening</TableHead>
            <TableHead className="font-semibold text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            Array.from({ length: 5 }).map((_, idx) => (
              <TableRow key={`skeleton-${idx}`}>
                <TableCell>
                  <div className="flex flex-col gap-2">
                    <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="h-4 w-16 animate-pulse rounded bg-muted" />
                </TableCell>
                <TableCell>
                  <div className="h-6 w-20 animate-pulse rounded bg-muted" />
                </TableCell>
                <TableCell>
                  <div className="h-6 w-24 animate-pulse rounded bg-muted" />
                </TableCell>
                <TableCell>
                  <div className="h-4 w-28 animate-pulse rounded bg-muted" />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <div className="h-8 w-20 animate-pulse rounded bg-muted" />
                    <div className="h-8 w-20 animate-pulse rounded bg-muted" />
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : paginated.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                No matching patients found.
              </TableCell>
            </TableRow>
          ) : (
            paginated.map((p, idx) => (
              <TableRow
                key={p.patient_code}
                className="data-row"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                {/* 1. Patient Name */}
                <TableCell>
                  <div className="flex flex-col">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="font-medium text-foreground inline-block w-full truncate cursor-help">
                            {p.name}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs break-words">
                          {p.name}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <span className="text-xs text-muted-foreground">
                      ID: {p.patient_code}
                    </span>
                  </div>
                </TableCell>

                {/* 2. Age / Sex */}
                <TableCell className="text-muted-foreground">
                  {p.age} / {p.gender}
                </TableCell>

                {/* 3. Risk Percentage */}
                <TableCell>
                  {p.risk_percent != null ? (
                    <Badge
                      variant={
                        p.risk_band
                          ? getRiskBadgeVariantByBand(p.risk_band)
                          : getRiskBadgeVariantByPercent(p.risk_percent)
                      }
                      className="font-semibold"
                    >
                      {p.risk_percent.toFixed(2)}%
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">N/A</span>
                  )}
                </TableCell>

                {/* 4. Risk Level */}
                <TableCell>
                  {p.risk_band || p.risk_percent != null ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge
                            variant={
                              p.risk_band
                                ? getRiskBadgeVariantByBand(p.risk_band)
                                : getRiskBadgeVariantByPercent(p.risk_percent)
                            }
                            className="max-w-[140px] truncate inline-block"
                          >
                            {p.risk_band ??
                              getRiskCategory(p.risk_percent).charAt(0).toUpperCase() +
                                getRiskCategory(p.risk_percent).slice(1) +
                                " Risk"}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs break-words">
                          {p.risk_band ?? getRiskCategory(p.risk_percent)}
                          {p.risk_percent != null
                            ? ` (${p.risk_percent.toFixed(2)}%)`
                            : ""}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    <span className="text-muted-foreground">N/A</span>
                  )}
                </TableCell>

                {/* 5. Last Screening */}
                <TableCell className="text-muted-foreground">
                  {p.latestEEGDate
                    ? new Date(p.latestEEGDate).toLocaleDateString()
                    : "No screening"}
                </TableCell>

                {/* 6. Actions */}
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {(p.prescription_path || p.prescription_url) && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewPrescription(p)}
                          className="h-9 w-9 p-0"
                          title="View Prescription"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadPrescription(p)}
                          className="h-9 w-9 p-0"
                          title="Download Prescription"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {onEditPatient && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditPatient(p)}
                        title="Edit Patient"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    {onDeletePatient && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => onDeletePatient(p.patient_code)}
                        title="Delete Patient"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        navigate(
                          `/patient-history/${btoa(encodeURIComponent(p.patient_code))}`,
                          { state: { patient: p } }
                        )
                      }
                      title="View Screening History"
                    >
                      <Eye className="mr-1 h-4 w-4" />
                      View
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        navigate(`/longitudinal/${encodeURIComponent(p.patient_code)}`)
                      }
                      title="View Longitudinal Trends"
                    >
                      <TrendingUp className="mr-1 h-4 w-4" />
                      Trends
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Pagination */}
      {totalPages > 1 && !loading && (
        <div className="border-t border-border/70 bg-background/80 px-4 py-3">
          <Pagination>
            <PaginationContent>
              <PaginationPrevious
                onClick={(e) => {
                  e.preventDefault();
                  setPage((prev) => Math.max(1, prev - 1));
                }}
              />
              {renderPagination()}
              <PaginationNext
                onClick={(e) => {
                  e.preventDefault();
                  setPage((prev) => Math.min(totalPages, prev + 1));
                }}
              />
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN PAGE COMPONENT (K8e in Live)
// ═════════════════════════════════════════════════════════════════════════════
export default function Reports() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  // Add / Edit Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [form, setForm] = useState<PatientPayload>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Delete AlertDialog state
  const [deleteCode, setDeleteCode] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const data = await getPatientsDb();
      const list: Patient[] = Array.isArray(data) ? data : data?.patients ?? [];
      const enriched = await Promise.all(
        list.map(async (patient) => {
          try {
            const history = await getPatientHistory(patient.patient_code);
            const latest = history && history.length > 0 ? history[0] : null;
            return {
              ...patient,
              latestEEGDate:
                latest?.date || latest?.created_at || latest?.report_date,
              latestEEGQuality: latest?.quality || latest?.eeg_quality,
              latestRiskLevel: latest?.risk_level,
              latestProbability: latest?.probability,
              latestScore: latest?.internal_brain_health_score,
            };
          } catch {
            return patient;
          }
        })
      );
      setPatients(enriched);
    } catch {
      toast.error("Failed to load patients");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const openCreate = () => {
    setEditingCode(null);
    setForm(emptyForm);
    setFormError("");
    setDialogOpen(true);
  };

  const openEdit = (p: Patient) => {
    setEditingCode(p.patient_code);
    setForm({
      hospital_id: 1,
      patient_code: p.patient_code,
      name: p.name,
      age: p.age,
      gender: p.gender,
    });
    setFormError("");
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    setFormError("");
    setSubmitting(true);
    try {
      if (editingCode) {
        await editPatient(editingCode, form);
        toast.success("Patient updated successfully");
      } else {
        await createPatient(form);
        toast.success("Patient added successfully");
      }
      setDialogOpen(false);
      fetchPatients();
    } catch (err: any) {
      setFormError(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteCode) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await deletePatient(deleteCode);
      setDeleteCode(null);
      fetchPatients();
    } catch (err: any) {
      setDeleteError(err.message || "Failed to delete patient");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <MainLayout>
      <div>
        <PatientScreeningSummaryTable
          patients={patients}
          loading={loading}
          onEditPatient={openEdit}
          onDeletePatient={(code) => setDeleteCode(code)}
          onAddPatient={openCreate}
        />
      </div>

      {/* Add / Edit Patient Modal Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCode ? "Edit Patient" : "Add Patient"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {formError && <p className="text-sm text-red-500">{formError}</p>}
            <div className="space-y-1">
              <Label>Patient Code</Label>
              <Input
                value={form.patient_code}
                disabled={!!editingCode}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, patient_code: e.target.value }))
                }
                placeholder="e.g. P002"
              />
            </div>
            <div className="space-y-1">
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Full name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Age</Label>
                <Input
                  type="number"
                  value={form.age || ""}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, age: Number(e.target.value) }))
                  }
                  placeholder="Age"
                />
              </div>
              <div className="space-y-1">
                <Label>Gender</Label>
                <Input
                  value={form.gender}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, gender: e.target.value }))
                  }
                  placeholder="M / F"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting
                ? "Saving..."
                : editingCode
                ? "Save Changes"
                : "Create Patient"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Patient Confirmation AlertDialog */}
      <AlertDialog
        open={!!deleteCode}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteCode(null);
            setDeleteError("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Patient</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete patient <strong>{deleteCode}</strong>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && (
            <p className="text-sm text-red-500 px-1">{deleteError}</p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
