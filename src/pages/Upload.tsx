import { useState, useEffect, useRef } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Upload as UploadIcon,
  FileText,
  User,
  Check,
  Loader2,
  ArrowRight,
  Plus,
  Brain,
  ClipboardList,
  Activity,
  LayoutGrid,
  Pill,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { API_BASE_URL } from "@/app/config";
import { getPatientsDb, createPatient } from "@/app/patients";

// ─── Types ────────────────────────────────────────────────────────────────────
type Step = 1 | 2 | 3 | 4 | 5 | 6;
type ModuleType = "cognitive" | "technician" | "eeg-analysis" | "";

interface Patient {
  patient_code: string;
  name: string;
  age: number;
  gender: string;
  hospital?: string;
  hospitalAddress?: string;
}

interface QualityResult {
  overallScore: number;
  badChannels: string[];
  muscleArtifacts: string;
  eyeBlinkContamination: string;
  lineNoise?: string;
  movementArtifacts?: string;
  badChannelNames?: string[];
  flatChannelNames?: string[];
  lowCorrelationChannelNames?: string[];
  dropoutChannelNames?: string[];
  penalties?: string[];
  selectedChannelCount?: number;
  missingChannelCount?: number;
  analysisType?: string;
  importantNote?: string;
  qualityLabel?: string;
  recommendations?: string[];
  sleepStageIndicators?: Record<string, boolean>;
  qualityScore0to100?: number;
  findings?: string[];
}

// ─── Module definitions ───────────────────────────────────────────────────────
const MODULES = [
  {
    id: "cognitive" as ModuleType,
    name: "EEG Cognitive Screening",
    description: "CognEEG-powered brain health report. Identifies early cognitive risk, brain fog indicators, and dementia biomarkers from the EEG signal.",
    icon: Brain,
  },
  {
    id: "technician" as ModuleType,
    name: "EEG Technician Report",
    description: "Standard EEG reading and signal analysis. Suitable for routine neurological reviews, documentation, and technician sign-off.",
    icon: ClipboardList,
  },
  {
    id: "eeg-analysis" as ModuleType,
    name: "EEG Signal Analysis",
    description: "Deep signal-level EEG analysis. Reviews waveform patterns, sleep stages, and spectral markers for detailed neurological insight.",
    icon: Activity,
  },
];

const STEPS = [
  { number: 1 as Step, title: "Module", icon: LayoutGrid },
  { number: 2 as Step, title: "Patient", icon: User },
  { number: 3 as Step, title: "Details", icon: ClipboardList },
  { number: 4 as Step, title: "Medications", icon: Pill },
  { number: 5 as Step, title: "Upload EEG", icon: UploadIcon },
  { number: 6 as Step, title: "Quality", icon: Activity },
];

const HARDWARE_BRANDS = [
  "Nihon Kohden",
  "Natus",
  "RMS Maximus",
  "Allengers",
  "X-Tech",
  "Clarity",
];

const EMOTIV_CHANNELS = [
  "AF3", "F7", "F3", "FC5", "T7", "P7", "O1", "O2", "P8", "T8", "FC6", "F4", "F8", "AF4",
];

// ─── Drug effects database ────────────────────────────────────────────────────
const DRUG_EFFECTS: Record<string, { summary: string; affected: string[]; color: string }> = {
  phenytoin: { summary: "Increases slow waves — may elevate CDI and FSI scores", affected: ["CDI", "FSI"], color: "amber" },
  dilantin: { summary: "Increases slow waves — may elevate CDI and FSI scores", affected: ["CDI", "FSI"], color: "amber" },
  phenobarbitone: { summary: "Increases beta activity — may suppress alpha peak frequency", affected: ["Alpha Peak Freq", "PDI"], color: "amber" },
  phenobarbital: { summary: "Increases beta activity — may suppress alpha peak frequency", affected: ["Alpha Peak Freq", "PDI"], color: "amber" },
  clonazepam: { summary: "Benzodiazepine — increases beta, suppresses theta/beta ratio", affected: ["FSI", "FTB Ratio"], color: "orange" },
  lorazepam: { summary: "Benzodiazepine — increases beta, suppresses theta/beta ratio", affected: ["FSI", "FTB Ratio"], color: "orange" },
  diazepam: { summary: "Benzodiazepine — increases beta, suppresses theta/beta ratio", affected: ["FSI", "FTB Ratio"], color: "orange" },
  clobazam: { summary: "Benzodiazepine — increases beta, suppresses theta/beta ratio", affected: ["FSI", "FTB Ratio"], color: "orange" },
  valproate: { summary: "Increases delta/theta power — may elevate CDI and slow alpha", affected: ["CDI", "Alpha Peak Freq"], color: "amber" },
  "valproic acid": { summary: "Increases delta/theta power — may elevate CDI and slow alpha", affected: ["CDI", "Alpha Peak Freq"], color: "amber" },
  "sodium valproate": { summary: "Increases delta/theta power — may elevate CDI and slow alpha", affected: ["CDI", "Alpha Peak Freq"], color: "amber" },
  carbamazepine: { summary: "May reduce overall amplitude — mild effect on gamma activity", affected: ["Gamma Ratio"], color: "yellow" },
  levetiracetam: { summary: "Generally EEG-neutral, but may slightly reduce cortical excitability", affected: [], color: "green" },
  haloperidol: { summary: "Antipsychotic — slows alpha peak frequency, increases delta/theta", affected: ["Alpha Peak Freq", "CDI"], color: "red" },
  risperidone: { summary: "Antipsychotic — slows alpha peak frequency, increases delta/theta", affected: ["Alpha Peak Freq", "CDI"], color: "red" },
  olanzapine: { summary: "Antipsychotic — slows alpha peak frequency, increases delta/theta", affected: ["Alpha Peak Freq", "CDI"], color: "red" },
  lithium: { summary: "May cause diffuse slowing at high doses — watch CDI and FSI", affected: ["CDI", "FSI"], color: "amber" },
  amitriptyline: { summary: "Tricyclic antidepressant — may increase slow-wave activity", affected: ["CDI"], color: "yellow" },
  sertraline: { summary: "SSRI — generally minimal EEG effect", affected: [], color: "green" },
  fluoxetine: { summary: "SSRI — generally minimal EEG effect", affected: [], color: "green" },
  midazolam: { summary: "Benzodiazepine sedative — strongly increases beta, suppresses alpha", affected: ["PDI", "FSI", "Alpha Peak Freq"], color: "red" },
  propofol: { summary: "Anaesthetic — burst suppression pattern, invalidates most biomarkers", affected: ["All biomarkers"], color: "red" },
  ketamine: { summary: "Dissociative anaesthetic — increases gamma and theta simultaneously", affected: ["Gamma Ratio", "CDI"], color: "orange" },
};

const COMMON_DRUGS = Object.keys(DRUG_EFFECTS);

export default function Upload() {
  const navigate = useNavigate();
  const location = useLocation();

  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [selectedModule, setSelectedModule] = useState<ModuleType | null>(null);

  // ── Patients ───────────────────────────────────────────────────────────────
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientCode, setSelectedPatientCode] = useState("");
  const [patientSearch, setPatientSearch] = useState("");
  const [isAddPatientModalOpen, setIsAddPatientModalOpen] = useState(false);

  const [newPatient, setNewPatient] = useState({
    name: "",
    age: "",
    gender: "",
    patient_code: "",
    hospital: "",
    hospitalAddress: "",
    handedness: "",
    neuroNo: "",
    uhid: "",
    eegNo: "",
    doctor: "",
  });

  // ── Details (step 3) ───────────────────────────────────────────────────────
  const [details, setDetails] = useState({
    name: "",
    age: "",
    gender: "",
    id: "",
    notes: "",
    mocaScore: "",
    mmseScore: "",
    handedness: "",
    neuroNo: "",
    uhid: "",
    eegNo: "",
    doctor: "",
    hospital: "",
    hospitalAddress: "",
  });

  // ── Files & Upload (step 5) ────────────────────────────────────────────────
  const [file, setFile] = useState<File | null>(null);
  const [prescriptionFile, setPrescriptionFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isPrescriptionDragging, setIsPrescriptionDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedJobId, setUploadedJobId] = useState<string | null>(null);

  // ── Quality (step 6) ───────────────────────────────────────────────────────
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [qualityResult, setQualityResult] = useState<QualityResult | null>(null);
  const [resultId, setResultId] = useState<string | null>(null);

  // ── Features & Emotiv ──────────────────────────────────────────────────────
  const [features, setFeatures] = useState<Record<string, any>>({});
  const [isEmotiv, setIsEmotiv] = useState(false);
  const [excludedChannels, setExcludedChannels] = useState<string[]>([]);

  // ── Medications (step 4) ───────────────────────────────────────────────────
  const [medList, setMedList] = useState<string[]>([]);
  const [medInput, setMedInput] = useState("");

  const addMed = (val: string) => {
    const trimmed = val.trim().toLowerCase();
    if (trimmed && !medList.includes(trimmed)) {
      setMedList((prev) => [...prev, trimmed]);
    }
    setMedInput("");
  };

  const removeMed = (med: string) => {
    setMedList((prev) => prev.filter((m) => m !== med));
  };

  const getDrugWarnings = () => {
    return medList
      .map((med) => ({ drug: med, effect: DRUG_EFFECTS[med] }))
      .filter((item) => item.effect !== undefined);
  };

  const toggleExcludedChannel = (ch: string) => {
    setExcludedChannels((prev) =>
      prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]
    );
  };

  // ── Initial load ───────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const d = await getPatientsDb();
        const list = Array.isArray(d) ? d : d?.patients ?? [];
        setPatients(list);
      } catch (err) {
        console.error("Error fetching patients:", err);
      }
    })();

    (async () => {
      try {
        const res = await fetchWithAuth(`${API_BASE_URL}/me/features`);
        if (res.ok) {
          const feat = (await res.json()).features ?? {};
          setFeatures(feat);
          if (Array.isArray(feat.emotiv_bad_channels)) {
            setExcludedChannels(feat.emotiv_bad_channels);
          }
        }
      } catch {}
    })();
  }, []);

  const filteredPatients = patients.filter((p) => {
    if (!patientSearch.trim()) return true;
    const q = patientSearch.toLowerCase().trim();
    return [p.name, p.patient_code, p.gender].some((v) =>
      String(v).toLowerCase().includes(q)
    );
  });

  const handleSelectPatient = (p: Patient) => {
    setSelectedPatientCode(p.patient_code);
    setDetails({
      name: p.name,
      age: p.age.toString(),
      gender: p.gender,
      id: p.patient_code,
      notes: "",
      mocaScore: "",
      mmseScore: "",
      handedness: "",
      neuroNo: "",
      uhid: "",
      eegNo: "",
      doctor: "",
      hospital: p.hospital ?? "",
      hospitalAddress: p.hospitalAddress ?? "",
    });
  };

  const handleAddPatient = async () => {
    if (!newPatient.name || !newPatient.age || !newPatient.gender || !newPatient.patient_code) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    try {
      const payload = {
        hospital_id: 1,
        patient_code: newPatient.patient_code,
        name: newPatient.name,
        age: parseInt(newPatient.age),
        gender: newPatient.gender,
        hospital: newPatient.hospital,
        hospitalAddress: newPatient.hospitalAddress,
      };
      await createPatient(payload);
      const d = await getPatientsDb();
      const list = Array.isArray(d) ? d : d?.patients ?? [];
      setPatients(list);
      handleSelectPatient({
        patient_code: newPatient.patient_code,
        name: newPatient.name,
        age: parseInt(newPatient.age),
        gender: newPatient.gender,
      });
      setDetails((prev) => ({
        ...prev,
        hospital: newPatient.hospital,
        hospitalAddress: newPatient.hospitalAddress,
        handedness: newPatient.handedness,
        neuroNo: newPatient.neuroNo,
        uhid: newPatient.uhid,
        eegNo: newPatient.eegNo,
        doctor: newPatient.doctor,
      }));
      setIsAddPatientModalOpen(false);
      setNewPatient({
        name: "",
        age: "",
        gender: "",
        patient_code: "",
        hospital: "",
        hospitalAddress: "",
        handedness: "",
        neuroNo: "",
        uhid: "",
        eegNo: "",
        doctor: "",
      });
      toast({
        title: "Patient Added",
        description: "New patient has been added successfully.",
      });
    } catch (err: any) {
      console.error("Error adding patient:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to add patient. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f && (f.name.endsWith(".edf") || f.name.endsWith(".bdf"))) {
      setFile(f);
    } else {
      toast({
        title: "Invalid file format",
        description: "Please upload an EDF or BDF file",
        variant: "destructive",
      });
    }
  };

  const handlePrescriptionDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsPrescriptionDragging(false);
    const f = e.dataTransfer.files[0];
    if (f && [".pdf", ".jpg", ".jpeg", ".png"].some((ext) => f.name.toLowerCase().endsWith(ext))) {
      setPrescriptionFile(f);
    } else {
      toast({
        title: "Invalid file format",
        description: "Please upload a PDF or image file (JPG, PNG)",
        variant: "destructive",
      });
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("patient_code", selectedPatientCode);
      if (prescriptionFile) formData.append("prescription", prescriptionFile);
      formData.append("device_type", isEmotiv ? "emotiv" : "standard");
      formData.append("report_type", selectedModule ?? "technician");
      if (medList.length > 0) formData.append("medications", medList.join(","));
      if (isEmotiv && excludedChannels.length > 0) {
        formData.append("bad_channels", excludedChannels.join(","));
      }

      const res = await fetchWithAuth(`${API_BASE_URL}/upload`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      const jobId = data.job_id || data.id;
      setUploadedJobId(jobId);

      await fetchWithAuth(`${API_BASE_URL}/patient-info/${encodeURIComponent(String(jobId))}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: details.name,
          age: details.age,
          gender: details.gender,
          id: details.id,
          notes: details.notes,
          moca_score: details.mocaScore,
          mmse_score: details.mmseScore,
          handedness: details.handedness,
          neuro_no: details.neuroNo,
          uhid: details.uhid,
          eeg_no: details.eegNo,
          doctor: details.doctor,
          hospital: details.hospital,
          hospital_address: details.hospitalAddress,
        }),
      });

      toast({
        title: "Upload Successful",
        description: "EEG file uploaded. Proceeding to quality check.",
      });
      setCurrentStep(5);
    } catch {
      toast({
        title: "Upload Failed",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const runQualityCheck = async () => {
    if (!uploadedJobId) return;
    setIsAnalyzing(true);
    try {
      const res = await fetchWithAuth(
        `${API_BASE_URL}/quality-check/${encodeURIComponent(String(uploadedJobId))}`,
        { method: "GET" }
      );
      if (res.ok) {
        const data = await res.json();
        const combinedRaw = data.sleep_markers?.combined_analysis ?? data.combined_analysis;
        let combined: any = null;
        if (combinedRaw) {
          if (typeof combinedRaw === "string") {
            try {
              combined = JSON.parse(combinedRaw);
            } catch {
              combined = null;
            }
          } else if (typeof combinedRaw === "object") {
            combined = combinedRaw;
          }
        }

        const parseList = (a: any, b: any = null) =>
          Array.isArray(a)
            ? a.map((x) => (typeof x === "object" && x !== null ? JSON.stringify(x) : String(x)))
            : Array.isArray(b)
            ? b.map((x) => (typeof x === "object" && x !== null ? JSON.stringify(x) : String(x)))
            : a
            ? [String(a)]
            : [];

        setQualityResult({
          overallScore: data.pipeline_quality?.overall_quality || data.quality_score_0_100 || 0,
          badChannels: data.pipeline_quality?.bad_channels || [],
          muscleArtifacts: data.pipeline_quality?.muscle_artifacts || "Low",
          eyeBlinkContamination: data.pipeline_quality?.eye_blinks || "Low",
          lineNoise: data.pipeline_quality?.line_noise || "Unknown",
          movementArtifacts: data.pipeline_quality?.movement_artifacts || "Unknown",
          badChannelNames: data.pipeline_quality?.bad_channel_names || [],
          flatChannelNames: data.flat_channel_names || [],
          lowCorrelationChannelNames: data.low_correlation_channel_names || [],
          dropoutChannelNames: data.dropout_channel_names || [],
          penalties: parseList(data.quality_details?.penalties),
          selectedChannelCount: data.selected_channel_count,
          missingChannelCount: data.missing_channel_count,
          analysisType: data.analysis_type || data.sleep_markers?.analysis_type || combined?.analysis_type,
          importantNote: data.important_note || data.sleep_markers?.important_note || combined?.important_note,
          qualityLabel: data.quality_label || data.sleep_markers?.quality_label || combined?.quality_label,
          recommendations: parseList(data.recommendations, combined?.recommendations),
          sleepStageIndicators: data.sleep_stage_indicators || data.sleep_markers?.sleep_stage_indicators || combined?.sleep_stage_indicators,
          qualityScore0to100: data.quality_score_0_100 ?? combined?.quality_score_0_100,
          findings: parseList(data.findings, combined?.findings),
        });
        setResultId(data.result_id);
        toast({
          title: "Quality Check Complete",
          description: "Analysis completed successfully.",
        });
      } else {
        throw new Error("Quality check failed");
      }
    } catch (err) {
      console.error("Error in quality check:", err);
      toast({
        title: "Quality Check Failed",
        description: "Failed to run quality analysis. You can still proceed.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateReport = () => {
    if (!uploadedJobId) {
      toast({
        title: "No Job ID",
        description: "Please upload a file first.",
        variant: "destructive",
      });
      return;
    }
    if (!selectedModule) {
      toast({
        title: "No Pipeline",
        description: "Please restart and select a module.",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Generating Report",
      description: "Redirecting to your report...",
    });

    if (selectedModule === "technician") {
      navigate("/eeg-technician-report", { state: { jobId: uploadedJobId } });
      return;
    }
    if (selectedModule === "eeg-analysis") {
      navigate(`/report-eeg/${encodeURIComponent(String(resultId))}`, {
        state: { fromEegAnalysis: true, reportId: encodeURIComponent(String(uploadedJobId)) },
      });
      return;
    }
    navigate(`/report/${encodeURIComponent(String(uploadedJobId))}`, {
      state: { fromEegAnalysis: false, reportId: encodeURIComponent(String(uploadedJobId)) },
    });
  };

  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <MainLayout>
      {/* Add Patient Modal */}
      <Dialog open={isAddPatientModalOpen} onOpenChange={setIsAddPatientModalOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Add New Patient
            </DialogTitle>
            <DialogDescription>
              Enter patient details. All fields except name, ID, age, and gender are optional.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2">
              <Label htmlFor="new-name">
                Full Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="new-name"
                value={newPatient.name}
                onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
                placeholder="e.g. Ramesh Kumar"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="new-patient-code">
                Patient ID / Code <span className="text-destructive">*</span>
              </Label>
              <Input
                id="new-patient-code"
                value={newPatient.patient_code}
                onChange={(e) => setNewPatient({ ...newPatient, patient_code: e.target.value })}
                placeholder="Unique ID"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="new-age">
                Age <span className="text-destructive">*</span>
              </Label>
              <Input
                id="new-age"
                type="number"
                value={newPatient.age}
                onChange={(e) => setNewPatient({ ...newPatient, age: e.target.value })}
                placeholder="Years"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="new-gender">
                Gender <span className="text-destructive">*</span>
              </Label>
              <Select
                value={newPatient.gender}
                onValueChange={(val) => setNewPatient({ ...newPatient, gender: val })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">Male</SelectItem>
                  <SelectItem value="F">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="new-handedness">Handedness</Label>
              <Select
                value={newPatient.handedness}
                onValueChange={(val) => setNewPatient({ ...newPatient, handedness: val })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Right">Right</SelectItem>
                  <SelectItem value="Left">Left</SelectItem>
                  <SelectItem value="Ambidextrous">Ambidextrous</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="new-neuro-no">Neuro No.</Label>
              <Input
                id="new-neuro-no"
                value={newPatient.neuroNo}
                onChange={(e) => setNewPatient({ ...newPatient, neuroNo: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="new-uhid">UHID / Unit</Label>
              <Input
                id="new-uhid"
                value={newPatient.uhid}
                onChange={(e) => setNewPatient({ ...newPatient, uhid: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="new-eeg-no">EEG No.</Label>
              <Input
                id="new-eeg-no"
                value={newPatient.eegNo}
                onChange={(e) => setNewPatient({ ...newPatient, eegNo: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="new-doctor">Doctor</Label>
              <Input
                id="new-doctor"
                value={newPatient.doctor}
                onChange={(e) => setNewPatient({ ...newPatient, doctor: e.target.value })}
                className="mt-1"
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="new-hospital">Hospital</Label>
              <Input
                id="new-hospital"
                value={newPatient.hospital}
                onChange={(e) => setNewPatient({ ...newPatient, hospital: e.target.value })}
                placeholder="Hospital name"
                className="mt-1"
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="new-hospital-address">Hospital Address</Label>
              <Input
                id="new-hospital-address"
                value={newPatient.hospitalAddress}
                onChange={(e) => setNewPatient({ ...newPatient, hospitalAddress: e.target.value })}
                placeholder="Full hospital address"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddPatientModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddPatient}>Add Patient</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Main Content */}
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">New EEG Screening</h1>
            <p className="text-sm text-muted-foreground mt-1">Complete all steps to generate a clinical report</p>
          </div>
          <Badge variant="outline" className="text-xs px-3 py-1">
            Step {currentStep} of {STEPS.length}
          </Badge>
        </div>

        {/* Stepper */}
        <div className="flex items-center">
          {STEPS.map((step, idx) => (
            <div key={step.number} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-200",
                    currentStep > step.number
                      ? "border-green-500 bg-green-500 text-white"
                      : currentStep === step.number
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground"
                  )}
                >
                  {currentStep > step.number ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <step.icon className="h-4 w-4" />
                  )}
                </div>
                <span
                  className={cn(
                    "text-xs font-medium whitespace-nowrap",
                    currentStep >= step.number ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {step.title}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 flex-1 mx-2 mb-4 transition-all duration-200",
                    currentStep > step.number ? "bg-green-500" : "bg-border"
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Card Body */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          {/* ── Step 1: Module ───────────────────────────────────────────── */}
          {currentStep === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Select Screening Module</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Choose the analysis pipeline before adding patient details
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {MODULES.map((mod) => (
                  <div
                    key={mod.id}
                    onClick={() => setSelectedModule(mod.id)}
                    className={cn(
                      "p-5 rounded-xl border-2 cursor-pointer transition-all",
                      selectedModule === mod.id
                        ? "border-primary bg-accent"
                        : "border-border hover:border-primary/50 hover:bg-muted/30"
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-xl mb-4",
                        selectedModule === mod.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      <mod.icon className="h-6 w-6" />
                    </div>
                    <h3 className="font-semibold text-foreground">{mod.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                      {mod.description}
                    </p>
                    {selectedModule === mod.id && (
                      <div className="flex items-center gap-1.5 mt-3 text-xs font-semibold text-primary">
                        <Check className="h-4 w-4" /> Selected
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-end pt-2 border-t border-border">
                <Button onClick={() => setCurrentStep(2)} disabled={!selectedModule}>
                  Continue <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* ── Step 2: Patient ──────────────────────────────────────────── */}
          {currentStep === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Select Patient</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Search for an existing patient or register a new one for{" "}
                  <span className="font-medium text-foreground">
                    {selectedModule === "cognitive"
                      ? "Cognitive Screening"
                      : selectedModule === "technician"
                      ? "Technician Report"
                      : "EEG Signal Analysis"}
                  </span>
                </p>
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                    placeholder="Search by name, patient ID, or gender..."
                    className="pl-9"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={() => setIsAddPatientModalOpen(true)}
                  className="flex items-center gap-1.5 shrink-0"
                >
                  <Plus className="h-4 w-4" />
                  New Patient
                </Button>
              </div>
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {filteredPatients.length === 0 && (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    {patientSearch
                      ? "No patients match your search."
                      : "No patients found. Add a new patient to get started."}
                  </div>
                )}
                {filteredPatients.map((p) => (
                  <div
                    key={p.patient_code}
                    onClick={() => handleSelectPatient(p)}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all",
                      selectedPatientCode === p.patient_code
                        ? "border-primary bg-accent"
                        : "border-border hover:border-primary/50 hover:bg-muted/40"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold shrink-0",
                          selectedPatientCode === p.patient_code
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-foreground">{p.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {p.patient_code} · {p.gender} · {p.age} yrs
                        </div>
                      </div>
                    </div>
                    {selectedPatientCode === p.patient_code && (
                      <Check className="h-5 w-5 text-primary shrink-0" />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-between pt-2 border-t border-border">
                <Button variant="outline" onClick={() => setCurrentStep(1)}>
                  ← Back
                </Button>
                <Button
                  onClick={() => {
                    if (!selectedPatientCode) {
                      toast({
                        title: "Select Patient",
                        description: "Please select a patient to continue.",
                        variant: "destructive",
                      });
                      return;
                    }
                    setCurrentStep(3);
                  }}
                  disabled={!selectedPatientCode}
                >
                  Continue <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* ── Step 3: Details ──────────────────────────────────────────── */}
          {currentStep === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Patient Details</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Confirm and complete clinical information for{" "}
                  <span className="font-medium text-foreground">{details.name}</span>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-x-8 gap-y-0">
                {/* Left col */}
                <div className="space-y-4">
                  <div>
                    <Label>Patient</Label>
                    <Select
                      value={selectedPatientCode}
                      onValueChange={(val) => {
                        const found = patients.find((p) => p.patient_code === val);
                        if (found) handleSelectPatient(found);
                      }}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select patient" />
                      </SelectTrigger>
                      <SelectContent>
                        {patients.map((p) => (
                          <SelectItem key={p.patient_code} value={p.patient_code}>
                            {p.name} ({p.patient_code}) · {p.gender} · {p.age} yrs
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Patient name</Label>
                    <Input
                      value={details.name}
                      onChange={(e) => setDetails({ ...details, name: e.target.value })}
                      placeholder="Full name"
                      className="mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Age</Label>
                      <Input
                        type="number"
                        value={details.age}
                        onChange={(e) => setDetails({ ...details, age: e.target.value })}
                        placeholder="Years"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Gender</Label>
                      <Select
                        value={details.gender}
                        onValueChange={(val) => setDetails({ ...details, gender: val })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="M">Male</SelectItem>
                          <SelectItem value="F">Female</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label>Handedness</Label>
                    <Select
                      value={details.handedness}
                      onValueChange={(val) => setDetails({ ...details, handedness: val })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Right">Right</SelectItem>
                        <SelectItem value="Left">Left</SelectItem>
                        <SelectItem value="Ambidextrous">Ambidextrous</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Right col */}
                <div className="space-y-4">
                  <div>
                    <Label>Neuro No.</Label>
                    <Input
                      value={details.neuroNo}
                      onChange={(e) => setDetails({ ...details, neuroNo: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>UHID / Unit</Label>
                    <Input
                      value={details.uhid}
                      onChange={(e) => setDetails({ ...details, uhid: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>EEG No.</Label>
                    <Input
                      value={details.eegNo}
                      onChange={(e) => setDetails({ ...details, eegNo: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Doctor</Label>
                    <Input
                      value={details.doctor}
                      onChange={(e) => setDetails({ ...details, doctor: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>
                      Hospital <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      value={details.hospital}
                      onChange={(e) => setDetails({ ...details, hospital: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>
                      Hospital Address <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      value={details.hospitalAddress}
                      onChange={(e) => setDetails({ ...details, hospitalAddress: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {selectedModule === "cognitive" && (
                <div className="border-t border-border pt-4 grid grid-cols-2 gap-4">
                  <div>
                    <Label>
                      MoCA Score{" "}
                      <span className="text-xs text-muted-foreground font-normal">(0–30)</span>
                    </Label>
                    <Input
                      type="number"
                      value={details.mocaScore}
                      onChange={(e) => setDetails({ ...details, mocaScore: e.target.value })}
                      placeholder="0–30"
                      className="mt-1"
                      min={0}
                      max={30}
                    />
                  </div>
                  <div>
                    <Label>
                      MMSE Score{" "}
                      <span className="text-xs text-muted-foreground font-normal">(0–30)</span>
                    </Label>
                    <Input
                      type="number"
                      value={details.mmseScore}
                      onChange={(e) => setDetails({ ...details, mmseScore: e.target.value })}
                      placeholder="0–30"
                      className="mt-1"
                      min={0}
                      max={30}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Clinical Notes</Label>
                    <Textarea
                      value={details.notes}
                      onChange={(e) => setDetails({ ...details, notes: e.target.value })}
                      placeholder="Relevant medications, medical history, or clinical observations..."
                      className="mt-1 h-20 resize-none"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-2 border-t border-border">
                <Button variant="outline" onClick={() => setCurrentStep(2)}>
                  ← Back
                </Button>
                {selectedModule === "technician" ? (
                  <Button
                    onClick={() => {
                      if (!details.name) {
                        toast({
                          title: "Patient name required",
                          description: "Please enter the patient name before continuing.",
                          variant: "destructive",
                        });
                        return;
                      }
                      navigate("/eeg-technician-report", {
                        state: {
                          patientInfo: {
                            name: details.name,
                            age: details.age,
                            gender: details.gender,
                            id: details.id,
                            handedness: details.handedness,
                            neuroNo: details.neuroNo,
                            uhid: details.uhid,
                            eegNo: details.eegNo,
                            doctor: details.doctor,
                            hospital: details.hospital,
                            hospitalAddress: details.hospitalAddress,
                          },
                        },
                      });
                    }}
                  >
                    Open Technician Report <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button onClick={() => setCurrentStep(4)}>
                    Continue <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* ── Step 4: Medications ──────────────────────────────────────── */}
          {currentStep === 4 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Medications &amp; Drug Indications
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Enter any medications the patient is currently taking. Known EEG-affecting drugs will be flagged on the report.
                </p>
              </div>

              <div>
                <Label className="mb-2 block">Current Medications</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      value={medInput}
                      onChange={(e) => setMedInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && medInput.trim()) {
                          e.preventDefault();
                          addMed(medInput);
                        }
                      }}
                      placeholder="Type medication name and press Enter..."
                      className="pr-10"
                      list="drug-suggestions"
                    />
                    <datalist id="drug-suggestions">
                      {COMMON_DRUGS.map((d) => (
                        <option key={d} value={d} />
                      ))}
                    </datalist>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (medInput.trim()) addMed(medInput);
                    }}
                  >
                    Add
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Common AEDs and psychotropics are auto-recognised. You can add any drug name.
                </p>
              </div>

              {medList.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {medList.map((m) => (
                    <span
                      key={m}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1 text-sm font-medium text-foreground capitalize"
                    >
                      {m}
                      <button
                        type="button"
                        onClick={() => removeMed(m)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                        aria-label={`Remove ${m}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {getDrugWarnings().length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    EEG Effect Warnings
                  </p>
                  {getDrugWarnings().map(({ drug, effect }) => (
                    <div
                      key={drug}
                      className={cn(
                        "rounded-lg border px-4 py-3 text-sm",
                        effect.color === "red" &&
                          "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30",
                        effect.color === "orange" &&
                          "border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/30",
                        effect.color === "amber" &&
                          "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30",
                        effect.color === "yellow" &&
                          "border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/30",
                        effect.color === "green" &&
                          "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="font-semibold capitalize">{drug}</span>
                          <span className="mx-2 text-muted-foreground">—</span>
                          <span>{effect.summary}</span>
                        </div>
                      </div>
                      {effect.affected.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {effect.affected.map((aff) => (
                            <span
                              key={aff}
                              className="rounded-md border border-current/20 bg-white/50 dark:bg-black/20 px-2 py-0.5 text-xs font-medium"
                            >
                              {aff}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {medList.length > 0 && getDrugWarnings().length === 0 && (
                <div className="rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30 px-4 py-3 text-sm text-green-800 dark:text-green-300">
                  No known EEG-affecting drugs detected. Biomarker readings can be interpreted at face value.
                </div>
              )}

              {medList.length === 0 && (
                <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                  No medications entered. If the patient is on AEDs, benzodiazepines, antipsychotics, or anaesthetics, add them above — they can significantly alter EEG biomarkers.
                </div>
              )}

              <div className="flex justify-between pt-2 border-t border-border">
                <Button variant="outline" onClick={() => setCurrentStep(3)}>
                  ← Back
                </Button>
                <Button onClick={() => setCurrentStep(5)}>
                  Continue <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* ── Step 5: Upload EEG ───────────────────────────────────────── */}
          {currentStep === 5 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Upload EEG File</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Upload the EEG recording for{" "}
                  <span className="font-medium text-foreground">{details.name}</span>
                </p>
              </div>

              <div className="rounded-lg bg-muted/40 border border-border p-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Supported Formats
                  </p>
                  <div className="flex gap-2">
                    <Badge variant="secondary" className="font-mono text-xs">
                      EDF
                    </Badge>
                    <Badge variant="secondary" className="font-mono text-xs">
                      BDF
                    </Badge>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Compatible Hardware
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {HARDWARE_BRANDS.map((b) => (
                      <Badge key={b} variant="outline" className="text-xs">
                        {b}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {uploadedJobId ? (
                <div className="space-y-4">
                  <div className="rounded-lg border border-green-200 bg-green-50 p-4 flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-green-900">File Uploaded Successfully</p>
                      <p className="text-sm text-green-700 mt-0.5">
                        EEG file and patient data saved. Proceed to quality check.
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-border">
                    <Button variant="outline" onClick={() => setCurrentStep(4)}>
                      ← Back
                    </Button>
                    <Button onClick={() => setCurrentStep(6)}>
                      Proceed to Quality Check <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <div>
                    <p className="text-sm font-medium text-foreground mb-2">EEG File</p>
                    <div
                      className={cn(
                        "upload-zone",
                        isDragging && "upload-zone-active",
                        file && "border-green-400 bg-green-50/60"
                      )}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                      }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleFileDrop}
                    >
                      {file ? (
                        <div className="flex flex-col items-center gap-3">
                          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                            <FileText className="h-7 w-7 text-green-600" />
                          </div>
                          <div className="text-center">
                            <p className="font-medium text-foreground">{file.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => setFile(null)}>
                            Remove
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-3">
                          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                            <UploadIcon className="h-7 w-7 text-muted-foreground" />
                          </div>
                          <div className="text-center">
                            <p className="font-medium text-foreground">Drag &amp; drop EEG file here</p>
                            <p className="text-sm text-muted-foreground">
                              EDF or BDF — or click to browse
                            </p>
                          </div>
                          <input
                            type="file"
                            accept=".edf,.bdf"
                            className="hidden"
                            id="file-upload"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) setFile(f);
                            }}
                          />
                          <label htmlFor="file-upload">
                            <Button variant="outline" asChild>
                              <span>Browse Files</span>
                            </Button>
                          </label>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-border pt-5">
                    <p className="text-sm font-medium text-foreground mb-2">
                      Prescription / Referral{" "}
                      <span className="text-xs text-muted-foreground font-normal">(optional)</span>
                    </p>
                    <div
                      className={cn(
                        "upload-zone !py-5",
                        isPrescriptionDragging && "upload-zone-active",
                        prescriptionFile && "border-green-400 bg-green-50/60"
                      )}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsPrescriptionDragging(true);
                      }}
                      onDragLeave={() => setIsPrescriptionDragging(false)}
                      onDrop={handlePrescriptionDrop}
                    >
                      {prescriptionFile ? (
                        <div className="flex items-center gap-3 justify-center">
                          <FileText className="h-5 w-5 text-green-600 shrink-0" />
                          <div className="text-left min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {prescriptionFile.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {(prescriptionFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setPrescriptionFile(null)}
                          >
                            Remove
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 justify-center">
                          <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                          <span className="text-sm text-muted-foreground">
                            PDF, JPG, PNG accepted
                          </span>
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="hidden"
                            id="prescription-upload"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) setPrescriptionFile(f);
                            }}
                          />
                          <label htmlFor="prescription-upload">
                            <Button variant="outline" size="sm" asChild>
                              <span>Browse</span>
                            </Button>
                          </label>
                        </div>
                      )}
                    </div>
                  </div>

                  {features?.emotiv === true && (
                    <div className="border border-border rounded-lg px-4 py-3 space-y-3 bg-muted/30">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Brain className="h-5 w-5 text-purple-500 shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-foreground">Emotiv Device Used</p>
                            <p className="text-xs text-muted-foreground">
                              Consumer-grade EEG (14-channel). Scores will be calibrated accordingly.
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={isEmotiv}
                          onClick={() => setIsEmotiv((prev) => !prev)}
                          className={cn(
                            "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2",
                            isEmotiv ? "bg-purple-600" : "bg-slate-300 dark:bg-slate-600"
                          )}
                        >
                          <span
                            className={cn(
                              "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                              isEmotiv ? "translate-x-5" : "translate-x-0"
                            )}
                          />
                        </button>
                      </div>
                      {isEmotiv && (
                        <div className="border-t border-border pt-3">
                          <p className="text-xs font-medium text-foreground mb-2">
                            Non-working channels{" "}
                            <span className="text-muted-foreground font-normal">
                              (tap to mark — excluded from analysis)
                            </span>
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {EMOTIV_CHANNELS.map((ch) => {
                              const isExcluded = excludedChannels.includes(ch);
                              return (
                                <button
                                  key={ch}
                                  type="button"
                                  onClick={() => toggleExcludedChannel(ch)}
                                  className={cn(
                                    "text-xs px-2.5 py-1 rounded border transition-colors",
                                    isExcluded
                                      ? "bg-red-100 border-red-400 text-red-700 line-through dark:bg-red-900/40 dark:border-red-600 dark:text-red-400"
                                      : "bg-background border-border text-foreground hover:border-purple-400"
                                  )}
                                >
                                  {ch}
                                </button>
                              );
                            })}
                          </div>
                          {excludedChannels.length > 0 && (
                            <p className="text-xs text-red-500 mt-1.5">
                              Excluded: {excludedChannels.join(", ")}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex justify-between pt-2 border-t border-border">
                    <Button variant="outline" onClick={() => setCurrentStep(4)}>
                      ← Back
                    </Button>
                    <Button onClick={handleUpload} disabled={!file || isUploading}>
                      {isUploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          Upload &amp; Continue <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Step 6: Quality Check ────────────────────────────────────── */}
          {currentStep === 6 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Quality Check</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Analyse the uploaded EEG for signal quality before generating the report
                </p>
              </div>

              {qualityResult ? (
                <div className="space-y-4">
                  <div
                    className={cn(
                      "flex items-center justify-between p-4 rounded-xl border",
                      qualityResult.overallScore >= 70
                        ? "border-green-200 bg-green-50"
                        : "border-amber-200 bg-amber-50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {qualityResult.overallScore >= 70 ? (
                        <Check className="h-8 w-8 text-green-600 shrink-0" />
                      ) : (
                        <Activity className="h-8 w-8 text-amber-600 shrink-0" />
                      )}
                      <div>
                        <p
                          className={cn(
                            "font-semibold text-sm",
                            qualityResult.overallScore >= 70 ? "text-green-900" : "text-amber-900"
                          )}
                        >
                          {qualityResult.overallScore >= 70
                            ? "Quality Passed — Ready to Generate Report"
                            : "Below Threshold — Proceed with Caution"}
                        </p>
                        <p
                          className={cn(
                            "text-sm",
                            qualityResult.overallScore >= 70 ? "text-green-700" : "text-amber-700"
                          )}
                        >
                          Overall quality score: <strong>{qualityResult.overallScore}%</strong>
                        </p>
                      </div>
                    </div>
                    <div
                      className={cn(
                        "text-3xl font-extrabold",
                        qualityResult.overallScore >= 70 ? "text-green-700" : "text-amber-700"
                      )}
                    >
                      {qualityResult.overallScore}%
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Muscle Artifacts", value: qualityResult.muscleArtifacts },
                      { label: "Eye Blink Contamination", value: qualityResult.eyeBlinkContamination },
                      { label: "Line Noise", value: qualityResult.lineNoise },
                      { label: "Movement Artifacts", value: qualityResult.movementArtifacts },
                    ].map(({ label, value }) => (
                      <div key={label} className="rounded-xl border border-border bg-card p-4">
                        <p className="text-xs text-muted-foreground">{label}</p>
                        <p className="mt-1 font-semibold text-foreground text-sm">{value || "—"}</p>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-xl border border-border bg-card p-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                      Channel Health
                    </p>
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs">Bad Channels</p>
                        <p className="font-bold text-foreground">
                          {qualityResult.badChannelNames?.length || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Selected</p>
                        <p className="font-bold text-foreground">
                          {qualityResult.selectedChannelCount ?? "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Missing</p>
                        <p className="font-bold text-foreground">
                          {qualityResult.missingChannelCount ?? "—"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {qualityResult.penalties != null && qualityResult.penalties.length > 0 && (
                    <div className="rounded-xl border border-border bg-card p-4">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                        Quality Penalties
                      </p>
                      <ul className="space-y-1 text-sm text-foreground list-disc list-inside">
                        {qualityResult.penalties.map((pen, idx) => (
                          <li key={idx}>{pen}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {qualityResult.findings != null && qualityResult.findings.length > 0 && (
                    <div className="rounded-xl border border-border bg-card p-4">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                        Findings
                      </p>
                      <ul className="space-y-1 text-sm text-foreground list-disc list-inside">
                        {qualityResult.findings.map((f, idx) => (
                          <li key={idx}>{f}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="rounded-xl border border-border bg-muted/30 p-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                      Screening Summary
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs">Patient</p>
                        <p className="font-semibold text-foreground">{details.name || "—"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Age / Gender</p>
                        <p className="font-semibold text-foreground">
                          {details.age || "—"} / {details.gender || "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">EEG Quality</p>
                        <p className="font-semibold text-foreground">{qualityResult.overallScore}%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Pipeline</p>
                        <p className="font-semibold text-foreground">
                          {selectedModule === "cognitive"
                            ? "Cognitive"
                            : selectedModule === "technician"
                            ? "Technician"
                            : "Signal Analysis"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-2 border-t border-border">
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setCurrentStep(5)}>
                        ← Back
                      </Button>
                      {qualityResult.overallScore < 70 && (
                        <Button
                          variant="outline"
                          onClick={() => {
                            setQualityResult(null);
                            setFile(null);
                            setUploadedJobId(null);
                            setCurrentStep(5);
                          }}
                        >
                          Re-upload EEG
                        </Button>
                      )}
                    </div>
                    <Button onClick={handleGenerateReport} className="px-6">
                      Generate Report <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-xl border border-border bg-card p-8 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 mx-auto mb-4">
                      <Activity className="h-7 w-7 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground">EEG File Ready for Analysis</h3>
                    <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
                      Run the quality check to verify signal integrity before generating the clinical report.
                    </p>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-border">
                    <Button variant="outline" onClick={() => setCurrentStep(5)}>
                      ← Back
                    </Button>
                    <Button onClick={runQualityCheck} disabled={isAnalyzing}>
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Analysing EEG...
                        </>
                      ) : (
                        <>
                          Run Quality Check <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
