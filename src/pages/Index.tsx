import { useEffect, useState } from "react";
import { Activity, AlertTriangle, Users, CreditCard } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { ReportTable } from "@/components/dashboard/ReportTable";
import { FollowUpsSidebar } from "@/components/dashboard/FollowUpsSidebar";
import { AgeDistributionAndInsights } from "@/components/dashboard/AgeDistributionAndInsights";
import { getPatientsDb } from "@/app/patients";
import { API_BASE_URL } from "@/app/config";
import { getAuthToken } from "@/lib/utils";

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
  created_at?: string;
}

const OVERDUE_DAYS = 90;

export default function Index() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [todaysScreenCount, setTodaysScreenCount] = useState(0);
  const [highRiskCount, setHighRiskCount] = useState(0);
  const [avgPatientAge, setAvgPatientAge] = useState<number | null>(null);
  const [overduePatients, setOverduePatients] = useState<Patient[]>([]);
  const [credits, setCredits] = useState<number | null>(null);
  const [suspended, setSuspended] = useState(false);
  const [creditsExpiresAt, setCreditsExpiresAt] = useState<string | null>(null);

  const isToday = (dateStr?: string) => {
    if (!dateStr) return false;
    const now = new Date();
    const d = new Date(dateStr);
    return (
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    );
  };

  const isHighRisk = (risk?: string) => {
    return risk ? risk.toLowerCase().includes("high") : false;
  };

  useEffect(() => {
    (async () => {
      try {
        const data = await getPatientsDb();
        const list: Patient[] = (
          Array.isArray(data) ? data : data?.patients ?? []
        ).map((p: any) => ({
          ...p,
          latestEEGDate: p.created_at,
          latestRiskLevel: p.risk_band,
        }));

        const todayCount = list.filter((p) => isToday(p.latestEEGDate)).length;
        const highCount = list.filter((p) => isHighRisk(p.latestRiskLevel)).length;
        const ages = list.map((p) => Number(p.age)).filter((a) => a > 0);
        setAvgPatientAge(
          ages.length > 0
            ? Math.round(ages.reduce((sum, a) => sum + a, 0) / ages.length)
            : null
        );

        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - OVERDUE_DAYS);
        const overdue = list.filter((p) =>
          p.latestEEGDate ? new Date(p.latestEEGDate) < cutoff : true
        );

        setOverduePatients(overdue);
        setPatients(list);
        setTodaysScreenCount(todayCount);
        setHighRiskCount(highCount);
      } catch (err) {
        console.error("Error fetching patients:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token") || getAuthToken();
    if (token) {
      fetch(`${API_BASE_URL.replace(/\/$/, "")}/me/credits`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          setCredits(data.credits ?? null);
          setSuspended(data.suspended ?? false);
          setCreditsExpiresAt(data.credits_expires_at ?? null);
        })
        .catch(() => {});
    }
  }, []);

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Page Title */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of today's screenings and patient risk assessments
          </p>
        </div>

        {/* 4 Stats Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Today's Screens"
            value={todaysScreenCount}
            subtitle={
              todaysScreenCount === 0
                ? "No screenings today"
                : `${todaysScreenCount} screenings completed`
            }
            icon={Activity}
          />
          <StatsCard
            title="High-Risk Detected"
            value={highRiskCount}
            subtitle={
              highRiskCount === 0
                ? "No high-risk cases"
                : `${highRiskCount} high-risk cases found`
            }
            icon={AlertTriangle}
            variant="danger"
          />
          <StatsCard
            title="Avg Patient Age"
            value={avgPatientAge === null ? "—" : `${avgPatientAge} yrs`}
            subtitle={
              loading
                ? "Loading…"
                : `Across ${patients.length} patient${
                    patients.length !== 1 ? "s" : ""
                  }`
            }
            icon={Users}
            variant="default"
          />
          <StatsCard
            title="Credits Remaining"
            value={credits === null ? "—" : credits}
            subtitle={
              suspended
                ? "⚠ Account suspended"
                : creditsExpiresAt
                ? `Valid until ${new Date(creditsExpiresAt).toLocaleDateString()}`
                : credits === 0
                ? "Contact admin to top up"
                : "EEG report credits"
            }
            icon={CreditCard}
            variant={
              suspended || credits === 0
                ? "danger"
                : credits !== null && credits <= 5
                ? "warning"
                : "default"
            }
          />
        </div>

        {/* Main Content Grid: Table + Follow-ups Sidebar */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ReportTable patients={patients} loading={loading} />
          </div>

          <div className="lg:col-span-1">
            <FollowUpsSidebar
              overduePatients={overduePatients}
              overdueDays={OVERDUE_DAYS}
            />
          </div>
        </div>

        {/* Age Distribution & Insights Accordion */}
        <AgeDistributionAndInsights patients={patients} loading={loading} />
      </div>
    </MainLayout>
  );
}
