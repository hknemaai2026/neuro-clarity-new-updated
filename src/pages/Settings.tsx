import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  User,
  Link,
  Download,
  Shield,
  Users,
  Save,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { API_BASE_URL } from "@/app/config";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { useAuth } from "@/app/AuthContext";

const SETTINGS_KEY = "nema_settings";

interface SettingsState {
  doctorName: string;
  email: string;
  specialty: string;
  hospitalName: string;
  emrApiKey: string;
  emrEndpoint: string;
  autoExportPdf: boolean;
  includeGraphsInExport: boolean;
  exportFormat: string;
  consentTemplate: string;
  dataRetentionDays: string;
  anonymizeExports: boolean;
  adminAccess: boolean;
  viewerAccess: boolean;
}

function loadSavedSettings(): Partial<SettingsState> | null {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveSettingsToStorage(settings: SettingsState) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

const Settings = () => {
  const { user } = useAuth();
  const [showApiKey, setShowApiKey] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "ok" | "error">("idle");
  const [pwd, setPwd] = useState({ current: "", next: "", confirm: "" });
  const [updatingPwd, setUpdatingPwd] = useState(false);

  const [settings, setSettings] = useState<SettingsState>(() => {
    const saved = loadSavedSettings();
    return {
      doctorName: saved?.doctorName ?? "",
      email: saved?.email ?? "",
      specialty: saved?.specialty ?? "Neurology",
      hospitalName: saved?.hospitalName ?? sessionStorage.getItem("hospital_name") ?? "",
      emrApiKey: saved?.emrApiKey ?? "",
      emrEndpoint: saved?.emrEndpoint ?? "",
      autoExportPdf: saved?.autoExportPdf ?? false,
      includeGraphsInExport: saved?.includeGraphsInExport ?? true,
      exportFormat: saved?.exportFormat ?? "pdf",
      consentTemplate:
        saved?.consentTemplate ??
        "I consent to the use of EEG-based cognitive screening by NEMA AI CognEEG. I understand this is a probabilistic tool, not a diagnostic test, and results must be reviewed by a qualified clinician.",
      dataRetentionDays: saved?.dataRetentionDays ?? "365",
      anonymizeExports: saved?.anonymizeExports ?? false,
      adminAccess: saved?.adminAccess ?? true,
      viewerAccess: saved?.viewerAccess ?? false,
    };
  });

  useEffect(() => {
    if (user) {
      setSettings((prev) => ({
        ...prev,
        doctorName: prev.doctorName || user.name || "",
        email: prev.email || user.email || "",
        hospitalName:
          prev.hospitalName || user.hospital_name || sessionStorage.getItem("hospital_name") || "",
      }));
    }
  }, [user]);

  const updateSettings = (partial: Partial<SettingsState>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  };

  const handleSave = (sectionLabel: string) => {
    saveSettingsToStorage(settings);
    if (settings.hospitalName) {
      sessionStorage.setItem("hospital_name", settings.hospitalName);
    }
    toast({
      title: "Saved",
      description: `${sectionLabel} updated.`,
    });
  };

  const testConnection = async () => {
    if (!settings.emrEndpoint) {
      toast({
        title: "No endpoint set",
        description: "Enter an EMR API endpoint first.",
        variant: "destructive",
      });
      return;
    }
    setTestStatus("testing");
    try {
      const headers: Record<string, string> = {};
      if (settings.emrApiKey) {
        headers.Authorization = `Bearer ${settings.emrApiKey}`;
      }
      const res = await fetch(settings.emrEndpoint, {
        method: "GET",
        headers,
        signal: AbortSignal.timeout(8000),
      });
      setTestStatus(res.ok || res.status < 500 ? "ok" : "error");
    } catch {
      setTestStatus("error");
    }
  };

  const handlePasswordChange = async () => {
    if (!pwd.next || !pwd.current) {
      toast({ title: "Fill all fields", variant: "destructive" });
      return;
    }
    if (pwd.next !== pwd.confirm) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    if (pwd.next.length < 8) {
      toast({
        title: "Password must be at least 8 characters",
        variant: "destructive",
      });
      return;
    }
    setUpdatingPwd(true);
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          current_password: pwd.current,
          new_password: pwd.next,
        }),
      });
      if (res.ok) {
        toast({
          title: "Password changed",
          description: "Your password has been updated.",
        });
        setPwd({ current: "", next: "", confirm: "" });
      } else {
        const data = await res.json().catch(() => ({}));
        toast({
          title: "Failed",
          description: data?.detail || "Incorrect current password.",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Network error",
        description: "Could not reach the server.",
        variant: "destructive",
      });
    } finally {
      setUpdatingPwd(false);
    }
  };

  return (
    <MainLayout>
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Manage your account, integrations, and preferences</p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="profile" className="gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="integration" className="gap-2">
              <Link className="h-4 w-4" />
              <span className="hidden sm:inline">Integration</span>
            </TabsTrigger>
            <TabsTrigger value="export" className="gap-2">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export</span>
            </TabsTrigger>
            <TabsTrigger value="privacy" className="gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Privacy</span>
            </TabsTrigger>
            <TabsTrigger value="roles" className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Roles</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <div className="space-y-6">
              <div className="clinical-card space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Doctor Information</h2>
                  <p className="text-sm text-muted-foreground">
                    Your professional details shown on reports
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="doctorName">Full Name</Label>
                    <Input
                      id="doctorName"
                      value={settings.doctorName}
                      onChange={(e) => updateSettings({ doctorName: e.target.value })}
                      placeholder="Dr. Your Name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={settings.email}
                      readOnly
                      className="bg-muted/40 cursor-not-allowed"
                    />
                    <p className="text-xs text-muted-foreground">
                      Email is tied to your account and cannot be changed here.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="specialty">Specialty</Label>
                    <Select
                      value={settings.specialty}
                      onValueChange={(val) => updateSettings({ specialty: val })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Neurology">Neurology</SelectItem>
                        <SelectItem value="Psychiatry">Psychiatry</SelectItem>
                        <SelectItem value="Geriatrics">Geriatrics</SelectItem>
                        <SelectItem value="General Medicine">General Medicine</SelectItem>
                        <SelectItem value="Neuropsychology">Neuropsychology</SelectItem>
                        <SelectItem value="Rehabilitation Medicine">
                          Rehabilitation Medicine
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hospital">Hospital / Clinic Name</Label>
                    <Input
                      id="hospital"
                      value={settings.hospitalName}
                      onChange={(e) => updateSettings({ hospitalName: e.target.value })}
                      placeholder="Your Hospital Name"
                    />
                  </div>
                </div>

                <Button onClick={() => handleSave("Profile")} className="gap-2">
                  <Save className="h-4 w-4" />
                  Save Profile
                </Button>
              </div>

              {/* Change Password Card */}
              <div className="clinical-card space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <KeyRound className="h-4 w-4" />
                    Change Password
                  </h2>
                  <p className="text-sm text-muted-foreground">Update your login credentials</p>
                </div>

                <div className="space-y-4 max-w-sm">
                  <div className="space-y-2">
                    <Label>Current Password</Label>
                    <div className="relative">
                      <Input
                        type={showCurrent ? "text" : "password"}
                        value={pwd.current}
                        onChange={(e) => setPwd({ ...pwd, current: e.target.value })}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrent(!showCurrent)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>New Password</Label>
                    <div className="relative">
                      <Input
                        type={showNext ? "text" : "password"}
                        value={pwd.next}
                        onChange={(e) => setPwd({ ...pwd, next: e.target.value })}
                        placeholder="Min. 8 characters"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNext(!showNext)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showNext ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Confirm New Password</Label>
                    <Input
                      type="password"
                      value={pwd.confirm}
                      onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })}
                      placeholder="Repeat new password"
                    />
                    {pwd.confirm && pwd.next !== pwd.confirm && (
                      <p className="text-xs text-destructive">Passwords do not match.</p>
                    )}
                  </div>

                  <Button onClick={handlePasswordChange} disabled={updatingPwd} className="gap-2">
                    {updatingPwd ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <KeyRound className="h-4 w-4" />
                    )}
                    Update Password
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Integration Tab */}
          <TabsContent value="integration">
            <div className="clinical-card space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-foreground">EMR Integration</h2>
                <p className="text-sm text-muted-foreground">
                  Connect to your Electronic Medical Records system for report export
                </p>
              </div>

              <div className="rounded-lg border border-border bg-muted/20 px-4 py-3">
                <p className="text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">NEMA API server:</span>{" "}
                  <code className="text-xs">{API_BASE_URL}</code>
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="emrEndpoint">EMR API Endpoint</Label>
                  <Input
                    id="emrEndpoint"
                    value={settings.emrEndpoint}
                    onChange={(e) => updateSettings({ emrEndpoint: e.target.value })}
                    placeholder="https://your-emr.com/api"
                  />
                  <p className="text-xs text-muted-foreground">
                    Base URL of your hospital's EMR REST API
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apiKey">API Key / Token</Label>
                  <div className="relative">
                    <Input
                      id="apiKey"
                      type={showApiKey ? "text" : "password"}
                      value={settings.emrApiKey}
                      onChange={(e) => updateSettings({ emrApiKey: e.target.value })}
                      placeholder="Paste your EMR API key here"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Stored locally on this device only — never sent to NEMA servers
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div className="flex items-center gap-3">
                  {testStatus === "testing" ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : testStatus === "ok" ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : testStatus === "error" ? (
                    <XCircle className="h-4 w-4 text-destructive" />
                  ) : null}
                  <div>
                    <p className="font-medium text-foreground">Connection Status</p>
                    <p className="text-sm text-muted-foreground">
                      {testStatus === "idle" && "Not tested"}
                      {testStatus === "testing" && "Testing connection…"}
                      {testStatus === "ok" && "Connected — endpoint reachable"}
                      {testStatus === "error" && "Failed — check endpoint or API key"}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={testConnection}
                  disabled={testStatus === "testing"}
                >
                  {testStatus === "testing" ? "Testing…" : "Test Connection"}
                </Button>
              </div>

              <Button onClick={() => handleSave("Integration")} className="gap-2">
                <Save className="h-4 w-4" />
                Save Integration
              </Button>
            </div>
          </TabsContent>

          {/* Export Tab */}
          <TabsContent value="export">
            <div className="clinical-card space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Data Export Controls</h2>
                <p className="text-sm text-muted-foreground">
                  Configure how reports are exported and delivered
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div>
                    <p className="font-medium text-foreground">Auto-export to EMR after analysis</p>
                    <p className="text-sm text-muted-foreground">
                      Automatically push completed reports to your connected EMR
                    </p>
                  </div>
                  <Switch
                    checked={settings.autoExportPdf}
                    onCheckedChange={(val) => updateSettings({ autoExportPdf: val })}
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div>
                    <p className="font-medium text-foreground">Include spectral charts in exports</p>
                    <p className="text-sm text-muted-foreground">
                      Embed bar charts for bandpower and ratio data in PDF reports
                    </p>
                  </div>
                  <Switch
                    checked={settings.includeGraphsInExport}
                    onCheckedChange={(val) => updateSettings({ includeGraphsInExport: val })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Default Export Format</Label>
                  <Select
                    value={settings.exportFormat}
                    onValueChange={(val) => updateSettings({ exportFormat: val })}
                  >
                    <SelectTrigger className="w-56">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF (Print-ready)</SelectItem>
                      <SelectItem value="hl7">HL7 FHIR</SelectItem>
                      <SelectItem value="csv">CSV (Data only)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={() => handleSave("Export preferences")} className="gap-2">
                <Save className="h-4 w-4" />
                Save Preferences
              </Button>
            </div>
          </TabsContent>

          {/* Privacy Tab */}
          <TabsContent value="privacy">
            <div className="clinical-card space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Consent & Privacy</h2>
                <p className="text-sm text-muted-foreground">
                  Manage patient consent templates and data handling policies
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="consent">Default Patient Consent Template</Label>
                  <Textarea
                    id="consent"
                    value={settings.consentTemplate}
                    onChange={(e) => updateSettings({ consentTemplate: e.target.value })}
                    rows={5}
                    placeholder="Enter the consent text shown to patients before EEG screening…"
                  />
                  <p className="text-xs text-muted-foreground">
                    Printed on intake forms and consent documents.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Data Retention Period</Label>
                  <Select
                    value={settings.dataRetentionDays}
                    onValueChange={(val) => updateSettings({ dataRetentionDays: val })}
                  >
                    <SelectTrigger className="w-56">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="90">90 days</SelectItem>
                      <SelectItem value="180">180 days</SelectItem>
                      <SelectItem value="365">1 year</SelectItem>
                      <SelectItem value="730">2 years</SelectItem>
                      <SelectItem value="1825">5 years</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    How long patient records are retained before archival.
                  </p>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div>
                    <p className="font-medium text-foreground">Anonymize external exports</p>
                    <p className="text-sm text-muted-foreground">
                      Strip patient name, DOB, and contact fields when sharing data outside your institution
                    </p>
                  </div>
                  <Switch
                    checked={settings.anonymizeExports}
                    onCheckedChange={(val) => updateSettings({ anonymizeExports: val })}
                  />
                </div>
              </div>

              <Button onClick={() => handleSave("Privacy settings")} className="gap-2">
                <Save className="h-4 w-4" />
                Save Privacy Settings
              </Button>
            </div>
          </TabsContent>

          {/* Roles Tab */}
          <TabsContent value="roles">
            <div className="clinical-card space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Role-Based Access</h2>
                <p className="text-sm text-muted-foreground">
                  Control what each access level can do within your institution
                </p>
              </div>

              <div className="space-y-4">
                <div className="rounded-lg border border-border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-foreground">Administrator</p>
                      <p className="text-sm text-muted-foreground">
                        Full access — settings, user management, all data
                      </p>
                    </div>
                    <Switch
                      checked={settings.adminAccess}
                      onCheckedChange={(val) => updateSettings({ adminAccess: val })}
                    />
                  </div>
                </div>

                <div className="rounded-lg border border-border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-foreground">Clinician</p>
                      <p className="text-sm text-muted-foreground">
                        Can upload EEGs, view reports, and export data — always enabled
                      </p>
                    </div>
                    <Switch checked={true} disabled />
                  </div>
                </div>

                <div className="rounded-lg border border-border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-foreground">Viewer Only</p>
                      <p className="text-sm text-muted-foreground">
                        Read-only access to completed reports; cannot upload or edit
                      </p>
                    </div>
                    <Switch
                      checked={settings.viewerAccess}
                      onCheckedChange={(val) => updateSettings({ viewerAccess: val })}
                    />
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-muted/20 px-4 py-3">
                  <p className="text-xs text-muted-foreground">
                    Role assignments apply to all users under your hospital account. To invite or remove team members, contact your NEMA account manager.
                  </p>
                </div>
              </div>

              <Button onClick={() => handleSave("Role settings")} className="gap-2">
                <Save className="h-4 w-4" />
                Save Roles
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default Settings;
