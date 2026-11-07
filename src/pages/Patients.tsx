import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
  createPatient,
  editPatient,
  deletePatient,
  PatientPayload,
} from "@/app/patients";
import {
  Pencil,
  Trash2,
  Plus,
  Search,
  Sheet,
  Users,
  FileDown,
  Stethoscope,
} from "lucide-react";
import { toast } from "sonner";
import { API_BASE_URL } from "@/app/config";
import { getAuthToken, cn } from "@/lib/utils";

interface Patient {
  patient_code: string;
  name: string;
  age: number;
  gender: string;
  risk_band?: string;
  risk_percent?: number;
  technician_name?: string | null;
  has_prescription?: boolean;
  latest_result_id?: string | null;
  created_at?: string;
}

const GENDER_MAP: Record<string, string> = {
  M: "Male",
  F: "Female",
  male: "Male",
  female: "Female",
};

const AVATAR_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-teal-100 text-teal-700",
  "bg-violet-100 text-violet-700",
  "bg-orange-100 text-orange-700",
  "bg-rose-100 text-rose-700",
  "bg-green-100 text-green-700",
];

function avatarColor(name: string) {
  if (!name) return AVATAR_COLORS[0];
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

const emptyForm: PatientPayload = {
  hospital_id: 1,
  patient_code: "",
  name: "",
  age: 0,
  gender: "",
};

export default function Patients() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [form, setForm] = useState<PatientPayload>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const [deleteCode, setDeleteCode] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const data = await getPatientsDb();
      const list: Patient[] = Array.isArray(data) ? data : data?.patients ?? [];
      setPatients(list);
    } catch {
      toast.error("Failed to load patients");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const filtered = patients.filter((patient) => {
    const query = search.toLowerCase().trim();
    if (!query) return true;
    return [patient.name, patient.patient_code, patient.gender].some((val) =>
      String(val).toLowerCase().includes(query)
    );
  });

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
        toast.success("Patient updated");
      } else {
        await createPatient(form);
        toast.success("Patient added");
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
      toast.success("Patient deleted");
    } catch (err: any) {
      setDeleteError(err.message || "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  const handleDownloadPrescription = async (resultId: string, patientCode: string) => {
    const token = localStorage.getItem("token") || getAuthToken();
    if (!token) {
      toast.error("Not authenticated");
      return;
    }
    try {
      const url = `${API_BASE_URL}/download-prescription/${encodeURIComponent(resultId)}?token=${encodeURIComponent(token)}`;
      const res = await fetch(url);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Error ${res.status}`);
      }
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      const cd = res.headers.get("content-disposition");
      const ext = cd?.match(/\.(\w+)"?$/)?.[1] ?? "pdf";
      a.download = `Prescription_${patientCode}.${ext}`;
      a.click();
      URL.revokeObjectURL(blobUrl);
    } catch (err: any) {
      toast.error(err.message || "Download failed");
    }
  };

  const handleExportExcel = async () => {
    const token = localStorage.getItem("token") || getAuthToken();
    if (!token) {
      alert("Not authenticated");
      return;
    }
    try {
      const headRes = await fetch(`${API_BASE_URL}/export/results?token=${encodeURIComponent(token)}`, {
        method: "HEAD",
      }).catch(() => null);

      if (headRes && headRes.status === 403) {
        alert("Excel export is not enabled for your account. Please contact admin.");
        return;
      }
      window.open(`${API_BASE_URL}/export/results?token=${encodeURIComponent(token)}`, "_blank");
    } catch {
      alert("Failed to export Excel file");
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Patient Directory</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {patients.length} patient{patients.length !== 1 ? "s" : ""} registered
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleExportExcel}
              className="flex items-center gap-2"
            >
              <Sheet className="h-4 w-4" />
              Export Excel
            </Button>
            <Button
              onClick={openCreate}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Patient
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or patient ID..."
            className="pl-9"
          />
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-4 animate-pulse space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-muted" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-3.5 w-3/4 rounded bg-muted" />
                    <div className="h-3 w-1/2 rounded bg-muted" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="font-medium text-foreground">
              {search ? "No patients match your search" : "No patients yet"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {!search && "Add your first patient to get started."}
            </p>
            {!search && (
              <Button onClick={openCreate} className="mt-4" size="sm">
                <Plus className="mr-2 h-4 w-4" /> Add Patient
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((patient) => (
              <div
                key={patient.patient_code}
                className="rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Actions */}
                <div className="flex items-center justify-end gap-1 px-3 pt-3">
                  {patient.has_prescription && patient.latest_result_id && (
                    <button
                      onClick={() => handleDownloadPrescription(patient.latest_result_id!, patient.patient_code)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-blue-50 hover:text-blue-600 transition-colors"
                      title="Download prescription"
                    >
                      <FileDown className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => openEdit(patient)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    title="Edit patient"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteCode(patient.patient_code)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors"
                    title="Delete patient"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Card Content */}
                <div
                  className="px-4 pb-4 pt-2 cursor-pointer"
                  onClick={() =>
                    navigate(`/patient-history/${btoa(encodeURIComponent(patient.patient_code))}`, {
                      state: { patient },
                    })
                  }
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-bold",
                        avatarColor(patient.name)
                      )}
                    >
                      {patient.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground truncate">{patient.name}</p>
                      <p className="text-xs text-muted-foreground">{patient.patient_code}</p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground border-t border-border pt-3">
                    <span>{patient.age} yrs</span>
                    <span>·</span>
                    <span>{GENDER_MAP[patient.gender] ?? patient.gender}</span>
                    {patient.technician_name && (
                      <>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Stethoscope className="h-3 w-3" />
                          {patient.technician_name}
                        </span>
                      </>
                    )}
                  </div>

                  {patient.risk_band && (
                    <div className="mt-2">
                      <span
                        className={cn(
                          "inline-block px-2 py-0.5 rounded-full text-xs font-medium",
                          patient.risk_band.toLowerCase().includes("high")
                            ? "bg-red-100 text-red-700"
                            : patient.risk_band.toLowerCase().includes("mod")
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-green-100 text-green-700"
                        )}
                      >
                        {patient.risk_band}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Dialog */}
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
                onChange={(e) => setForm((prev) => ({ ...prev, patient_code: e.target.value }))}
                placeholder="e.g. P002"
              />
            </div>
            <div className="space-y-1">
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Full name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Age</Label>
                <Input
                  type="number"
                  value={form.age || ""}
                  onChange={(e) => setForm((prev) => ({ ...prev, age: Number(e.target.value) }))}
                  placeholder="Age"
                />
              </div>
              <div className="space-y-1">
                <Label>Gender</Label>
                <Input
                  value={form.gender}
                  onChange={(e) => setForm((prev) => ({ ...prev, gender: e.target.value }))}
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
              {submitting ? "Saving..." : editingCode ? "Save Changes" : "Create Patient"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation AlertDialog */}
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
              Are you sure you want to delete <strong>{deleteCode}</strong>? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && <p className="text-sm text-red-500 px-1">{deleteError}</p>}
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
