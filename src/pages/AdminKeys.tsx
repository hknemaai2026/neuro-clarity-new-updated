import React, { useState, useEffect, useRef } from "react";
import { API_BASE_URL } from "@/app/config";
import {
  KeyRound,
  LogOut,
  RefreshCw,
  Users,
  Trash2,
  Settings2,
  ChartNoAxesColumn,
  EyeOff,
  Eye,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

const REPORT_TABS_CONFIG: Record<string, string> = {
  risk_score: "Risk Score",
  brain_age: "Brain Age",
  biomarkers: "Biomarkers",
  ai_summary: "AI Summary",
  treatment_plan: "Treatment Plan",
  longitudinal: "Longitudinal",
  export: "Export",
  cohort_benchmarking: "Cohort Benchmarking",
};

const RESTRICTED_FEATURES_CONFIG: Record<string, string> = {
  export_excel: "📊 Excel Export",
  emotiv: "🧠 Emotiv Device",
};

const EMOTIV_CHANNELS = [
  "AF3", "F7", "F3", "FC5", "T7", "P7", "O1", "O2", "P8", "T8", "FC6", "F4", "F8", "AF4",
];

const SESSION_SECRET_KEY = "nema_admin_secret";

export default function AdminKeys() {
  const [secret, setSecret] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState("");
  const [activeTab, setActiveTab] = useState<"keys" | "accounts" | "analytics">("keys");

  const secretRef = useRef(secret);
  useEffect(() => {
    secretRef.current = secret;
  }, [secret]);

  useEffect(() => {
    localStorage.removeItem(SESSION_SECRET_KEY);
  }, []);

  const adminHeaders = () => ({
    "X-Admin-Secret": secretRef.current,
    "Content-Type": "application/json",
  });

  const apiBase = (API_BASE_URL || "").replace(/\/$/, "");

  // Keys tab state
  const [keys, setKeys] = useState<any[]>([]);
  const [keysLoading, setKeysLoading] = useState(false);
  const [creatingKey, setCreatingKey] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [copied, setCopied] = useState(false);
  const [keyError, setKeyError] = useState("");

  // Analytics tab state
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState("");

  // Accounts tab state
  const [accounts, setAccounts] = useState<any[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [accountsError, setAccountsError] = useState("");

  // Edit credits state
  const [editingCreditsUid, setEditingCreditsUid] = useState<string | null>(null);
  const [creditAmount, setCreditAmount] = useState("");
  const [creditMode, setCreditMode] = useState<"set" | "add">("set");
  const [creditExpiresAt, setCreditExpiresAt] = useState("");
  const [savingCredits, setSavingCredits] = useState(false);

  // Features configuration state
  const [featuresEditingUid, setFeaturesEditingUid] = useState<string | null>(null);
  const [editingFeatures, setEditingFeatures] = useState<Record<string, any>>({});
  const [savingFeatures, setSavingFeatures] = useState(false);

  // Handlers
  const handleLogin = async () => {
    setAuthError("");
    try {
      const res = await fetch(`${apiBase}/admin/keys`, {
        headers: {
          "X-Admin-Secret": secret,
          "Content-Type": "application/json",
        },
      });
      if (res.status === 401 || res.status === 403) {
        setAuthError("Invalid admin secret.");
        return;
      }
      const data = await res.json();
      setKeys(data.invite_keys || []);
      setIsAuthenticated(true);
    } catch {
      setAuthError("Could not reach server.");
    }
  };

  const fetchKeys = async () => {
    setKeysLoading(true);
    setKeyError("");
    try {
      const res = await fetch(`${apiBase}/admin/keys`, { headers: adminHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || res.statusText);
      setKeys(data.invite_keys || []);
    } catch (err: any) {
      setKeyError(err.message);
    } finally {
      setKeysLoading(false);
    }
  };

  const createKey = async () => {
    setCreatingKey(true);
    setKeyError("");
    setNewKey("");
    try {
      const res = await fetch(`${apiBase}/admin/keys`, {
        method: "POST",
        headers: adminHeaders(),
        body: JSON.stringify({ admin_identity: "nema-admin-portal" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || res.statusText);
      setNewKey(data.invite_key);
      fetchKeys();
    } catch (err: any) {
      setKeyError(err.message);
    } finally {
      setCreatingKey(false);
    }
  };

  const revokeKey = async (id: number | string) => {
    if (window.confirm("Revoke this key?")) {
      try {
        const res = await fetch(`${apiBase}/admin/keys/${id}`, {
          method: "DELETE",
          headers: adminHeaders(),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || res.statusText);
        }
        fetchKeys();
      } catch (err: any) {
        setKeyError(err.message);
      }
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fetchAccounts = async () => {
    setAccountsLoading(true);
    setAccountsError("");
    try {
      const res = await fetch(`${apiBase}/admin/hospitals`, { headers: adminHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || res.statusText);
      setAccounts(data.hospitals || []);
    } catch (err: any) {
      setAccountsError(err.message);
    } finally {
      setAccountsLoading(false);
    }
  };

  const saveCredits = async (uid: string) => {
    setSavingCredits(true);
    try {
      const expiresAt = creditExpiresAt ? new Date(creditExpiresAt).toISOString() : undefined;
      const payload: any = creditMode === "set" ? { set: parseInt(creditAmount, 10) } : { add: parseInt(creditAmount, 10) };
      if (expiresAt !== undefined) payload.expires_at = expiresAt;

      const res = await fetch(`${apiBase}/admin/hospitals/${uid}/credits`, {
        method: "PATCH",
        headers: adminHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || res.statusText);
      setEditingCreditsUid(null);
      setCreditAmount("");
      setCreditExpiresAt("");
      fetchAccounts();
    } catch (err: any) {
      setAccountsError(err.message);
    } finally {
      setSavingCredits(false);
    }
  };

  const deleteAccount = async (uid: string, name: string) => {
    if (window.confirm(`Permanently delete "${name}"? This cannot be undone.`)) {
      try {
        const res = await fetch(`${apiBase}/admin/hospitals/${uid}`, {
          method: "DELETE",
          headers: adminHeaders(),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || res.statusText);
        fetchAccounts();
      } catch (err: any) {
        setAccountsError(err.message);
      }
    }
  };

  const openFeaturesEditor = (hospital: any) => {
    setFeaturesEditingUid(hospital.hospital_uid);
    setEditingFeatures({ ...(hospital.features || {}) });
  };

  const saveFeatures = async (uid: string) => {
    setSavingFeatures(true);
    try {
      const res = await fetch(`${apiBase}/admin/hospitals/${uid}/features`, {
        method: "PATCH",
        headers: adminHeaders(),
        body: JSON.stringify({ features: editingFeatures }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || res.statusText);
      setFeaturesEditingUid(null);
      fetchAccounts();
    } catch (err: any) {
      setAccountsError(err.message);
    } finally {
      setSavingFeatures(false);
    }
  };

  const fetchAnalytics = async () => {
    setAnalyticsLoading(true);
    setAnalyticsError("");
    try {
      const res = await fetch(`${apiBase}/admin/analytics`, { headers: adminHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || res.statusText);
      setAnalyticsData(data);
    } catch (err: any) {
      setAnalyticsError(err.message);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const switchTab = (tab: "keys" | "accounts" | "analytics") => {
    setActiveTab(tab);
    if (tab === "accounts" && accounts.length === 0) fetchAccounts();
    if (tab === "analytics" && !analyticsData) fetchAnalytics();
  };

  // If not authenticated, render Gate
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center font-sans">
        <div className="bg-[#1e293b] border border-[#334155] rounded-2xl p-10 w-[380px] shadow-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-600/20 mb-4">
              <KeyRound className="w-6 h-6 text-blue-400" />
            </div>
            <h1 className="text-white text-2xl font-bold">NEMA Admin</h1>
            <p className="text-slate-400 text-sm mt-2">Invite key &amp; account management</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-slate-300 text-sm font-medium block mb-2">Admin Secret</label>
              <div className="relative">
                <input
                  type={showSecret ? "text" : "password"}
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  placeholder="Enter admin secret"
                  className="w-full px-4 py-3 pr-11 rounded-xl bg-[#0f172a] border border-[#475569] text-white placeholder-slate-500 text-sm outline-none focus:border-blue-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {authError && <p className="text-red-400 text-sm">{authError}</p>}
            <button
              onClick={handleLogin}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-sm transition-colors"
            >
              Access Admin Panel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated Admin Panel
  return (
    <div className="min-h-screen bg-[#0f172a] font-sans text-white">
      {/* Top Navbar */}
      <div className="border-b border-[#1e293b] px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600/20 flex items-center justify-center">
            <KeyRound className="w-4 h-4 text-blue-400" />
          </div>
          <span className="font-bold text-base">NEMA Admin</span>
        </div>
        <button
          onClick={() => {
            setIsAuthenticated(false);
            setSecret("");
          }}
          className="flex items-center gap-2 text-slate-400 hover:text-white border border-[#334155] rounded-lg px-3 py-1.5 text-xs transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" /> Lock
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#1e293b] px-8 flex gap-1">
        {[
          ["keys", "Invite Keys"],
          ["accounts", "Accounts & Credits"],
          ["analytics", "Analytics"],
        ].map(([tabKey, tabLabel]) => (
          <button
            key={tabKey}
            onClick={() => switchTab(tabKey as any)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tabKey
                ? "border-blue-500 text-white"
                : "border-transparent text-slate-500 hover:text-slate-300"
            }`}
          >
            {tabLabel}
          </button>
        ))}
      </div>

      {/* Main Container */}
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Tab 1: Invite Keys */}
        {activeTab === "keys" && (
          <React.Fragment>
            <div className="flex items-center gap-3">
              <button
                onClick={createKey}
                disabled={creatingKey}
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-semibold rounded-xl px-5 py-2.5 text-sm transition-colors whitespace-nowrap"
              >
                {creatingKey ? "Creating…" : "+ New Key"}
              </button>
              <button
                onClick={fetchKeys}
                className="border border-[#334155] text-slate-400 hover:text-white rounded-xl px-3 py-2.5 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {newKey && (
              <div className="bg-green-900/20 border border-green-700 rounded-xl p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-green-400 text-xs font-bold mb-1">NEW KEY CREATED</p>
                  <p className="font-mono text-xl font-bold tracking-widest text-green-300">{newKey}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(newKey)}
                  className="bg-green-700 hover:bg-green-600 text-white rounded-lg px-4 py-2 text-sm font-semibold shrink-0"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            )}

            {keyError && <p className="text-red-400 text-sm">{keyError}</p>}

            {keysLoading ? (
              <div className="text-slate-500 text-center py-16">Loading…</div>
            ) : keys.length === 0 ? (
              <div className="text-slate-600 text-center py-16 border border-dashed border-[#334155] rounded-xl">
                No invite keys yet.
              </div>
            ) : (
              <div className="border border-[#1e293b] rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-[#1e293b] border-b border-[#334155]">
                    <tr>
                      {["Key", "Status", "Created By", "Used By", "Created", ""].map((col) => (
                        <th key={col} className="px-4 py-3 text-left text-xs font-semibold text-slate-400">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {keys.map((k, idx) => (
                      <tr
                        key={k.id || idx}
                        className={`border-b border-[#1e293b] last:border-0 ${
                          idx % 2 === 0 ? "bg-[#111827]" : "bg-[#0f172a]"
                        }`}
                      >
                        <td className="px-4 py-3 font-mono font-bold tracking-wide">
                          <span className={k.is_used ? "text-slate-500" : "text-white"}>{k.key}</span>
                          {!k.is_used && (
                            <button
                              onClick={() => copyToClipboard(k.key)}
                              className="ml-2 text-xs border border-[#334155] rounded px-1.5 py-0.5 text-slate-400 hover:text-white transition-colors"
                            >
                              copy
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              k.is_used ? "bg-red-900/40 text-red-400" : "bg-green-900/40 text-green-400"
                            }`}
                          >
                            {k.is_used ? "Used" : "Available"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-400">{k.created_by || "—"}</td>
                        <td className="px-4 py-3 text-slate-400">{k.used_by || "—"}</td>
                        <td className="px-4 py-3 text-slate-500 text-xs">
                          {k.created_at ? new Date(k.created_at).toLocaleDateString() : "—"}
                        </td>
                        <td className="px-4 py-3">
                          {!k.is_used && (
                            <button
                              onClick={() => revokeKey(k.id)}
                              className="border border-red-900 text-red-400 hover:bg-red-900/20 rounded-lg px-3 py-1 text-xs font-semibold transition-colors"
                            >
                              Revoke
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </React.Fragment>
        )}

        {/* Tab 2: Accounts & Credits */}
        {activeTab === "accounts" && (
          <React.Fragment>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <Users className="w-4 h-4" />
                <span>
                  {accounts.length} account{accounts.length !== 1 ? "s" : ""}
                </span>
              </div>
              <button
                onClick={fetchAccounts}
                className="border border-[#334155] text-slate-400 hover:text-white rounded-xl px-3 py-2 transition-colors ml-auto"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {accountsError && <p className="text-red-400 text-sm">{accountsError}</p>}

            {accountsLoading ? (
              <div className="text-slate-500 text-center py-16">Loading…</div>
            ) : accounts.length === 0 ? (
              <div className="text-slate-600 text-center py-16 border border-dashed border-[#334155] rounded-xl">
                No accounts found.
              </div>
            ) : (
              <div className="border border-[#1e293b] rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-[#1e293b] border-b border-[#334155]">
                    <tr>
                      {["Name", "Email", "Credits", "Suspension Date", "Joined", ""].map((col) => (
                        <th key={col} className="px-4 py-3 text-left text-xs font-semibold text-slate-400">
                          {col}
                        </th>
                      ))}
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400">Features</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accounts.map((acc, idx) => (
                      <React.Fragment key={acc.hospital_uid}>
                        <tr className={`border-b border-[#1e293b] ${idx % 2 === 0 ? "bg-[#111827]" : "bg-[#0f172a]"}`}>
                          <td className="px-4 py-3 font-medium">{acc.hospital_name}</td>
                          <td className="px-4 py-3 text-slate-400">{acc.email}</td>
                          <td className="px-4 py-3" colSpan={editingCreditsUid === acc.hospital_uid ? 3 : 1}>
                            {editingCreditsUid === acc.hospital_uid ? (
                              <div className="flex flex-wrap items-center gap-2">
                                <select
                                  value={creditMode}
                                  onChange={(e) => setCreditMode(e.target.value as any)}
                                  className="bg-[#0f172a] border border-[#475569] text-white text-xs rounded-lg px-2 py-1.5 outline-none"
                                >
                                  <option value="set">Set to</option>
                                  <option value="add">Add</option>
                                </select>
                                <input
                                  type="number"
                                  min="0"
                                  value={creditAmount}
                                  onChange={(e) => setCreditAmount(e.target.value)}
                                  placeholder="credits"
                                  className="w-20 bg-[#0f172a] border border-[#475569] text-white text-xs rounded-lg px-2 py-1.5 outline-none focus:border-blue-500"
                                  autoFocus
                                />
                                <input
                                  type="date"
                                  value={creditExpiresAt}
                                  onChange={(e) => setCreditExpiresAt(e.target.value)}
                                  title="Suspension date — account blocked after this date"
                                  className="bg-[#0f172a] border border-[#475569] text-white text-xs rounded-lg px-2 py-1.5 outline-none focus:border-blue-500"
                                />
                                <button
                                  onClick={() => saveCredits(acc.hospital_uid)}
                                  disabled={savingCredits || (!creditAmount && !creditExpiresAt)}
                                  className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs rounded-lg px-3 py-1.5 font-semibold"
                                >
                                  {savingCredits ? "…" : "Save"}
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingCreditsUid(null);
                                    setCreditAmount("");
                                    setCreditExpiresAt("");
                                  }}
                                  className="text-slate-500 hover:text-white text-xs px-1"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span
                                  className={`font-bold ${
                                    acc.credits === 0
                                      ? "text-red-400"
                                      : acc.credits <= 5
                                      ? "text-yellow-400"
                                      : "text-green-400"
                                  }`}
                                >
                                  {acc.credits}
                                </span>
                                <button
                                  onClick={() => {
                                    setEditingCreditsUid(acc.hospital_uid);
                                    setCreditAmount("");
                                    setCreditMode("set");
                                    setCreditExpiresAt(
                                      acc.credits_expires_at ? acc.credits_expires_at.split("T")[0] : ""
                                    );
                                  }}
                                  className="text-xs border border-[#334155] rounded px-1.5 py-0.5 text-slate-400 hover:text-white transition-colors"
                                >
                                  edit
                                </button>
                              </div>
                            )}
                          </td>
                          {editingCreditsUid !== acc.hospital_uid && (
                            <React.Fragment>
                              <td className="px-4 py-3 text-xs">
                                {acc.credits_expires_at ? (
                                  <span
                                    className={
                                      new Date(acc.credits_expires_at) < new Date()
                                        ? "text-red-400"
                                        : "text-slate-400"
                                    }
                                  >
                                    {new Date(acc.credits_expires_at).toLocaleDateString()}
                                    {new Date(acc.credits_expires_at) < new Date() && " (suspended)"}
                                  </span>
                                ) : (
                                  <span className="text-slate-600">No suspension</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-slate-500 text-xs">
                                {acc.created_at ? new Date(acc.created_at).toLocaleDateString() : "—"}
                              </td>
                              <td className="px-4 py-3">
                                <button
                                  onClick={() => deleteAccount(acc.hospital_uid, acc.hospital_name)}
                                  className="text-slate-600 hover:text-red-400 transition-colors"
                                  title="Delete account"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                              <td className="px-4 py-3">
                                <button
                                  onClick={() =>
                                    featuresEditingUid === acc.hospital_uid
                                      ? setFeaturesEditingUid(null)
                                      : openFeaturesEditor(acc)
                                  }
                                  className={`transition-colors ${
                                    featuresEditingUid === acc.hospital_uid
                                      ? "text-blue-400"
                                      : "text-slate-600 hover:text-blue-400"
                                  }`}
                                  title="Toggle report tabs"
                                >
                                  <Settings2 className="w-4 h-4" />
                                </button>
                              </td>
                            </React.Fragment>
                          )}
                        </tr>

                        {/* Collapsible Features Editor */}
                        {featuresEditingUid === acc.hospital_uid && (
                          <tr className="bg-[#0d1a2e] border-b border-[#1e293b]">
                            <td colSpan={7} className="px-6 py-4">
                              <div className="flex items-center gap-2 mb-3">
                                <Settings2 className="w-4 h-4 text-blue-400" />
                                <span className="text-sm font-semibold text-blue-300">
                                  Report Tabs — {acc.hospital_name}
                                </span>
                              </div>

                              <div className="grid grid-cols-3 gap-2 mb-4">
                                {Object.keys(REPORT_TABS_CONFIG).map((featKey) => (
                                  <label key={featKey} className="flex items-center gap-2 cursor-pointer group">
                                    <div
                                      onClick={() =>
                                        setEditingFeatures((prev) => ({
                                          ...prev,
                                          [featKey]: !prev[featKey],
                                        }))
                                      }
                                      className={`relative w-8 h-4 rounded-full transition-colors cursor-pointer ${
                                        editingFeatures[featKey] !== false ? "bg-blue-600" : "bg-slate-700"
                                      }`}
                                    >
                                      <div
                                        className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${
                                          editingFeatures[featKey] !== false ? "translate-x-4" : "translate-x-0.5"
                                        }`}
                                      />
                                    </div>
                                    <span
                                      className={`text-xs select-none ${
                                        editingFeatures[featKey] !== false ? "text-slate-200" : "text-slate-500 line-through"
                                      }`}
                                    >
                                      {REPORT_TABS_CONFIG[featKey]}
                                    </span>
                                  </label>
                                ))}
                              </div>

                              <div className="border-t border-slate-700 pt-3 mb-4">
                                <p className="text-xs text-slate-500 mb-2 uppercase tracking-wide">
                                  Restricted Access (off by default)
                                </p>
                                <div className="flex flex-wrap gap-3">
                                  {Object.entries(RESTRICTED_FEATURES_CONFIG).map(([featKey, featLabel]) => (
                                    <div key={featKey} className="flex flex-col gap-1">
                                      <label className="flex items-center gap-2 cursor-pointer group">
                                        <div
                                          onClick={() =>
                                            setEditingFeatures((prev) => ({
                                              ...prev,
                                              [featKey]: !prev[featKey],
                                            }))
                                          }
                                          className={`relative w-8 h-4 rounded-full transition-colors cursor-pointer ${
                                            editingFeatures[featKey] === true ? "bg-emerald-600" : "bg-slate-700"
                                          }`}
                                        >
                                          <div
                                            className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${
                                              editingFeatures[featKey] === true ? "translate-x-4" : "translate-x-0.5"
                                            }`}
                                          />
                                        </div>
                                        <span
                                          className={`text-xs select-none ${
                                            editingFeatures[featKey] === true ? "text-emerald-300" : "text-slate-500"
                                          }`}
                                        >
                                          {featLabel}
                                        </span>
                                      </label>

                                      {featKey === "emotiv" && editingFeatures.emotiv === true && (
                                        <div className="ml-10 space-y-2">
                                          <div className="flex items-center gap-2">
                                            <span className="text-xs text-slate-500">Scale factor:</span>
                                            <input
                                              type="number"
                                              min="0.5"
                                              max="1.0"
                                              step="0.01"
                                              value={
                                                typeof editingFeatures.emotiv_scale === "number"
                                                  ? editingFeatures.emotiv_scale
                                                  : 0.85
                                              }
                                              onChange={(e) =>
                                                setEditingFeatures((prev) => ({
                                                  ...prev,
                                                  emotiv_scale: parseFloat(e.target.value),
                                                }))
                                              }
                                              className="w-20 bg-slate-800 border border-slate-600 rounded px-2 py-0.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                                            />
                                            <span className="text-xs text-slate-500">
                                              (
                                              {Math.round(
                                                (1 -
                                                  (typeof editingFeatures.emotiv_scale === "number"
                                                    ? editingFeatures.emotiv_scale
                                                    : 0.85)) *
                                                  100
                                              )}
                                              % reduction)
                                            </span>
                                          </div>

                                          <div>
                                            <p className="text-xs text-slate-500 mb-1">
                                              Non-working channels (excluded from all computations):
                                            </p>
                                            <div className="flex flex-wrap gap-1.5">
                                              {EMOTIV_CHANNELS.map((ch) => {
                                                const isBad = (
                                                  Array.isArray(editingFeatures.emotiv_bad_channels)
                                                    ? editingFeatures.emotiv_bad_channels
                                                    : []
                                                ).includes(ch);
                                                return (
                                                  <button
                                                    key={ch}
                                                    type="button"
                                                    onClick={() => {
                                                      const cur = Array.isArray(editingFeatures.emotiv_bad_channels)
                                                        ? [...editingFeatures.emotiv_bad_channels]
                                                        : [];
                                                      const updated = isBad
                                                        ? cur.filter((c) => c !== ch)
                                                        : [...cur, ch];
                                                      setEditingFeatures((prev) => ({
                                                        ...prev,
                                                        emotiv_bad_channels: updated,
                                                      }));
                                                    }}
                                                    className={`text-xs px-2 py-0.5 rounded border transition-colors ${
                                                      isBad
                                                        ? "bg-red-900/60 border-red-600 text-red-300 line-through"
                                                        : "bg-slate-800 border-slate-600 text-slate-400 hover:border-slate-400"
                                                    }`}
                                                  >
                                                    {ch}
                                                  </button>
                                                );
                                              })}
                                            </div>
                                            {Array.isArray(editingFeatures.emotiv_bad_channels) &&
                                              editingFeatures.emotiv_bad_channels.length > 0 && (
                                                <p className="text-xs text-red-400 mt-1">
                                                  Excluded: {editingFeatures.emotiv_bad_channels.join(", ")}
                                                </p>
                                              )}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => saveFeatures(acc.hospital_uid)}
                                  disabled={savingFeatures}
                                  className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs rounded-lg px-4 py-1.5 font-semibold transition-colors"
                                >
                                  {savingFeatures ? "Saving…" : "Save Features"}
                                </button>
                                <button
                                  onClick={() => setFeaturesEditingUid(null)}
                                  className="text-slate-500 hover:text-white text-xs px-2"
                                >
                                  Cancel
                                </button>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </React.Fragment>
        )}

        {/* Tab 3: Analytics */}
        {activeTab === "analytics" && (
          <React.Fragment>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <ChartNoAxesColumn className="w-4 h-4" />
                <span>Last 12 months · all accounts</span>
              </div>
              <button
                onClick={fetchAnalytics}
                className="border border-[#334155] text-slate-400 hover:text-white rounded-xl px-3 py-2 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {analyticsError && <p className="text-red-400 text-sm">{analyticsError}</p>}

            {analyticsLoading ? (
              <div className="text-slate-500 text-center py-16">Loading…</div>
            ) : analyticsData ? (
              <div className="space-y-8">
                {/* 4 KPI Summary Cards */}
                {(() => {
                  const totalReports = analyticsData.reports_over_time.reduce(
                    (sum: number, r: any) => sum + Number(r.count),
                    0
                  );
                  const abnormalReports = analyticsData.abnormal_over_time.reduce(
                    (sum: number, r: any) => sum + Number(r.abnormal || 0),
                    0
                  );
                  const totalTested = analyticsData.abnormal_over_time.reduce(
                    (sum: number, r: any) => sum + Number(r.total || 0),
                    0
                  );
                  const abnormalPct = totalTested > 0 ? Math.round((abnormalReports / totalTested) * 100) : 0;
                  const neverUploaded = analyticsData.churn.length;
                  const zeroCredits = analyticsData.credits_summary.filter(
                    (c: any) => c.credits_remaining === 0
                  ).length;

                  return (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      {[
                        { label: "Total Reports (12mo)", value: totalReports, color: "text-blue-400" },
                        { label: "Abnormal Detected", value: `${abnormalReports} (${abnormalPct}%)`, color: "text-red-400" },
                        { label: "Never Uploaded", value: neverUploaded, color: "text-yellow-400" },
                        { label: "Accounts at 0 Credits", value: zeroCredits, color: "text-orange-400" },
                      ].map((item) => (
                        <div key={item.label} className="bg-[#1e293b] border border-[#334155] rounded-xl p-4">
                          <p className="text-xs text-slate-500 mb-1">{item.label}</p>
                          <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
                        </div>
                      ))}
                    </div>
                  );
                })()}

                {/* Charts Grid 1 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* EEG Reports Over Time */}
                  <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-6">
                    <h3 className="text-sm font-semibold text-slate-300 mb-4">EEG Reports Over Time</h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={analyticsData.reports_over_time}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="month" tick={{ fill: "#94a3b8", fontSize: 10 }} />
                        <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} allowDecimals={false} />
                        <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8 }} />
                        <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} name="Reports" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* New Signups Per Month */}
                  <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-6">
                    <h3 className="text-sm font-semibold text-slate-300 mb-4">New Signups Per Month</h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={analyticsData.signups_over_time}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="month" tick={{ fill: "#94a3b8", fontSize: 10 }} />
                        <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} allowDecimals={false} />
                        <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8 }} />
                        <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} name="Signups" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Charts Grid 2 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Active Accounts Per Month */}
                  <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-6">
                    <h3 className="text-sm font-semibold text-slate-300 mb-4">Active Accounts Per Month</h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={analyticsData.active_accounts}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="month" tick={{ fill: "#94a3b8", fontSize: 10 }} />
                        <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} allowDecimals={false} />
                        <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8 }} />
                        <Bar dataKey="active_count" fill="#6366f1" radius={[4, 4, 0, 0]} name="Active accounts" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Avg Reports / Active Account */}
                  <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-6">
                    <h3 className="text-sm font-semibold text-slate-300 mb-4">Avg Reports / Active Account</h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={analyticsData.avg_per_account}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="month" tick={{ fill: "#94a3b8", fontSize: 10 }} />
                        <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} />
                        <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8 }} />
                        <Line type="monotone" dataKey="avg_reports" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} name="Avg reports" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Charts Grid 3 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Abnormal EEG Detections */}
                  <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-6">
                    <h3 className="text-sm font-semibold text-slate-300 mb-4">Abnormal EEG Detections</h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={analyticsData.abnormal_over_time}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="month" tick={{ fill: "#94a3b8", fontSize: 10 }} />
                        <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} allowDecimals={false} />
                        <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8 }} />
                        <Legend wrapperStyle={{ color: "#94a3b8", fontSize: 11 }} />
                        <Bar dataKey="total" fill="#334155" radius={[4, 4, 0, 0]} name="Total" />
                        <Bar dataKey="abnormal" fill="#ef4444" radius={[4, 4, 0, 0]} name="Abnormal" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* High-Risk Detections */}
                  <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-6">
                    <h3 className="text-sm font-semibold text-slate-300 mb-4">High-Risk Detections</h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={analyticsData.high_risk_over_time}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="month" tick={{ fill: "#94a3b8", fontSize: 10 }} />
                        <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} allowDecimals={false} />
                        <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8 }} />
                        <Legend wrapperStyle={{ color: "#94a3b8", fontSize: 11 }} />
                        <Bar dataKey="total" fill="#334155" radius={[4, 4, 0, 0]} name="Total" />
                        <Bar dataKey="high_risk" fill="#f97316" radius={[4, 4, 0, 0]} name="High risk" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Horizontal Bar: Reports Per Account */}
                <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-6">
                  <h3 className="text-sm font-semibold text-slate-300 mb-4">Reports Per Account</h3>
                  <ResponsiveContainer width="100%" height={Math.max(200, analyticsData.reports_per_account.length * 36)}>
                    <BarChart data={analyticsData.reports_per_account} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 10 }} allowDecimals={false} />
                      <YAxis type="category" dataKey="hospital_name" width={140} tick={{ fill: "#94a3b8", fontSize: 10 }} />
                      <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8 }} />
                      <Bar dataKey="report_count" fill="#10b981" radius={[0, 4, 4, 0]} name="Reports" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Horizontal Bar: Credits: Consumed vs Remaining */}
                <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-6">
                  <h3 className="text-sm font-semibold text-slate-300 mb-4">Credits: Consumed vs Remaining</h3>
                  <ResponsiveContainer width="100%" height={Math.max(200, analyticsData.credits_summary.length * 36)}>
                    <BarChart data={analyticsData.credits_summary} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 10 }} allowDecimals={false} />
                      <YAxis type="category" dataKey="hospital_name" width={140} tick={{ fill: "#94a3b8", fontSize: 10 }} />
                      <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8 }} />
                      <Legend wrapperStyle={{ color: "#94a3b8", fontSize: 11 }} />
                      <Bar dataKey="reports_total" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Consumed" stackId="a" />
                      <Bar dataKey="credits_remaining" fill="#334155" radius={[0, 4, 4, 0]} name="Remaining" stackId="a" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Prescriptions Uploaded Table */}
                {analyticsData.prescription_summary && analyticsData.prescription_summary.length > 0 && (
                  <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-6">
                    <h3 className="text-sm font-semibold text-slate-300 mb-4">📋 Prescriptions Uploaded — Account Breakdown</h3>
                    <table className="w-full text-sm">
                      <thead>
                        <tr>
                          {["Account", "Email", "Total EEGs", "Prescriptions", "% Coverage"].map((h) => (
                            <th key={h} className="text-left text-xs text-slate-500 pb-2 pr-4">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {analyticsData.prescription_summary.map((p: any, idx: number) => (
                          <tr key={idx} className="border-t border-[#334155]">
                            <td className="py-2 pr-4 text-slate-200 font-medium">{p.hospital_name}</td>
                            <td className="py-2 pr-4 text-slate-400 text-xs">{p.email}</td>
                            <td className="py-2 pr-4 text-slate-300">{p.total_eegs}</td>
                            <td className="py-2 pr-4 font-bold text-blue-400">{p.prescriptions_uploaded}</td>
                            <td className="py-2">
                              <div className="flex items-center gap-2">
                                <div className="w-20 h-1.5 rounded-full bg-slate-700">
                                  <div
                                    className="h-1.5 rounded-full bg-blue-500"
                                    style={{ width: `${Math.min(Number(p.prescription_pct) || 0, 100)}%` }}
                                  />
                                </div>
                                <span
                                  className={`text-xs font-semibold ${
                                    Number(p.prescription_pct) >= 80
                                      ? "text-green-400"
                                      : Number(p.prescription_pct) >= 40
                                      ? "text-yellow-400"
                                      : "text-slate-500"
                                  }`}
                                >
                                  {p.prescription_pct ?? 0}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Signed Up, Never Uploaded */}
                {analyticsData.churn.length > 0 && (
                  <div className="bg-[#1e293b] border border-yellow-900/50 rounded-xl p-6">
                    <h3 className="text-sm font-semibold text-yellow-400 mb-4">
                      ⚠ Signed Up, Never Uploaded ({analyticsData.churn.length})
                    </h3>
                    <table className="w-full text-sm">
                      <thead>
                        <tr>
                          {["Name", "Email", "Joined", "Credits"].map((h) => (
                            <th key={h} className="text-left text-xs text-slate-500 pb-2 pr-4">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {analyticsData.churn.map((c: any) => (
                          <tr key={c.email} className="border-t border-[#334155]">
                            <td className="py-2 pr-4 text-slate-300">{c.hospital_name}</td>
                            <td className="py-2 pr-4 text-slate-400">{c.email}</td>
                            <td className="py-2 pr-4 text-slate-500 text-xs">
                              {c.created_at ? new Date(c.created_at).toLocaleDateString() : "—"}
                            </td>
                            <td className={`py-2 font-bold ${c.credits === 0 ? "text-red-400" : "text-slate-300"}`}>
                              {c.credits}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Technician EEG Usage */}
                {analyticsData.technician_usage && analyticsData.technician_usage.length > 0 && (
                  <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-6">
                    <h3 className="text-sm font-semibold text-slate-300 mb-4">🩺 Technician EEG Usage</h3>
                    {analyticsData.report_type_summary && analyticsData.report_type_summary.length > 0 && (
                      <div className="flex gap-3 mb-4 flex-wrap">
                        {analyticsData.report_type_summary.map((t: any) => {
                          const label =
                            t.report_type === "cognitive"
                              ? "🧠 Cognitive Screening"
                              : t.report_type === "signal"
                              ? "📈 Signal Analysis"
                              : "📋 Technician Report";
                          return (
                            <div key={t.report_type} className="bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-xs">
                              <div className="text-slate-400">{label}</div>
                              <div className="font-bold text-white text-sm">{t.total} total</div>
                              <div className="text-slate-500">{t.last_30_days} last 30d</div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <table className="w-full text-sm">
                      <thead>
                        <tr>
                          {["Technician", "Account", "Report Type", "EEGs Run", "First EEG", "Last EEG"].map((h) => (
                            <th key={h} className="text-left text-xs text-slate-500 pb-2 pr-4">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {analyticsData.technician_usage.map((u: any, idx: number) => {
                          const typeLabel =
                            u.report_type === "cognitive"
                              ? "🧠 Cognitive"
                              : u.report_type === "signal"
                              ? "📈 Signal"
                              : "📋 Technician";
                          const typeColor =
                            u.report_type === "cognitive"
                              ? "text-purple-400"
                              : u.report_type === "signal"
                              ? "text-green-400"
                              : "text-blue-400";
                          return (
                            <tr key={idx} className="border-t border-[#334155]">
                              <td className="py-2 pr-4 font-medium text-slate-200">{u.technician_name}</td>
                              <td className="py-2 pr-4 text-slate-400">{u.hospital_name}</td>
                              <td className={`py-2 pr-4 text-xs font-medium ${typeColor}`}>{typeLabel}</td>
                              <td className="py-2 pr-4 font-bold text-blue-400">{u.eeg_count}</td>
                              <td className="py-2 pr-4 text-slate-500 text-xs">
                                {u.first_eeg ? new Date(u.first_eeg).toLocaleDateString() : "—"}
                              </td>
                              <td className="py-2 text-slate-500 text-xs">
                                {u.last_eeg ? new Date(u.last_eeg).toLocaleDateString() : "—"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Activation Speed (Days to First Upload) */}
                <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-6">
                  <h3 className="text-sm font-semibold text-slate-300 mb-4">Activation Speed (Days to First Upload)</h3>
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        {["Name", "Email", "First Upload", "Days to Activate"].map((h) => (
                          <th key={h} className="text-left text-xs text-slate-500 pb-2 pr-4">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {analyticsData.activation
                        .filter((a: any) => a.first_upload)
                        .map((a: any) => (
                          <tr key={a.email} className="border-t border-[#334155]">
                            <td className="py-2 pr-4 text-slate-300">{a.hospital_name}</td>
                            <td className="py-2 pr-4 text-slate-400">{a.email}</td>
                            <td className="py-2 pr-4 text-slate-500 text-xs">
                              {new Date(a.first_upload).toLocaleDateString()}
                            </td>
                            <td
                              className={`py-2 font-bold ${
                                Number(a.days_to_activate) <= 3
                                  ? "text-green-400"
                                  : Number(a.days_to_activate) <= 14
                                  ? "text-yellow-400"
                                  : "text-red-400"
                              }`}
                            >
                              {a.days_to_activate ?? "—"} days
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}
          </React.Fragment>
        )}
      </div>
    </div>
  );
}
