import { useState, useMemo } from "react";
import { TrendingUp, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";

interface Patient {
  patient_code: string;
  name: string;
  age: number;
  gender: string;
  risk_band?: string;
  risk_percent?: number;
}

interface AgeDistributionProps {
  patients: Patient[];
  loading?: boolean;
}

const AGE_BUCKETS = [
  { label: "< 18", min: 0, max: 17 },
  { label: "18–30", min: 18, max: 30 },
  { label: "31–45", min: 31, max: 45 },
  { label: "46–60", min: 46, max: 60 },
  { label: "61–75", min: 61, max: 75 },
  { label: "76+", min: 76, max: 999 },
];

const BUCKET_COLORS = [
  "#6366f1",
  "#3b82f6",
  "#06b6d4",
  "#10b981",
  "#f59e0b",
  "#ef4444",
];

function getAgeBucketIndex(age: number) {
  return AGE_BUCKETS.findIndex((b) => age >= b.min && age <= b.max);
}

const AgeTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="rounded-lg border bg-white shadow-lg p-3 text-sm space-y-1">
      <p className="font-semibold text-foreground">{label}</p>
      <p className="text-muted-foreground">
        {item.count} patient{item.count !== 1 ? "s" : ""}
      </p>
      {item.avgRisk !== null && (
        <p className="text-muted-foreground">
          Avg risk: <span className="font-medium text-foreground">{item.avgRisk}%</span>
        </p>
      )}
    </div>
  );
};

export function AgeDistributionAndInsights({
  patients,
  loading,
}: AgeDistributionProps) {
  const [open, setOpen] = useState(false);

  const { chartData, bucketDetails, insights } = useMemo(() => {
    const withAge = patients.filter((p) => p.age > 0);
    const bucketPatients: { patients: Patient[] }[] = AGE_BUCKETS.map(() => ({
      patients: [],
    }));

    withAge.forEach((p) => {
      const idx = getAgeBucketIndex(p.age);
      if (idx >= 0) bucketPatients[idx].patients.push(p);
    });

    const chartData = AGE_BUCKETS.map((bucket, idx) => {
      const pts = bucketPatients[idx].patients;
      const validRisk = pts.filter(
        (p) => p.risk_percent != null && p.risk_percent > 0
      );
      const avgRisk = validRisk.length
        ? Math.round(
            validRisk.reduce((acc, p) => acc + (p.risk_percent ?? 0), 0) /
              validRisk.length
          )
        : null;
      return {
        label: bucket.label,
        count: pts.length,
        avgRisk,
        color: BUCKET_COLORS[idx],
      };
    });

    const bucketDetails = AGE_BUCKETS.map((bucket, idx) => {
      const pts = bucketPatients[idx].patients;
      const high = pts.filter((p) =>
        (p.risk_band || "").toLowerCase().includes("high")
      ).length;
      const mod = pts.filter((p) =>
        (p.risk_band || "").toLowerCase().includes("mod")
      ).length;
      const low = pts.filter((p) =>
        (p.risk_band || "").toLowerCase().includes("low")
      ).length;
      const none = pts.length - high - mod - low;
      const validRisk = pts.filter(
        (p) => p.risk_percent != null && p.risk_percent > 0
      );
      const avgRisk = validRisk.length
        ? Math.round(
            validRisk.reduce((acc, p) => acc + (p.risk_percent ?? 0), 0) /
              validRisk.length
          )
        : null;
      return {
        label: bucket.label,
        count: pts.length,
        high,
        mod,
        low,
        none,
        avgRisk,
        color: BUCKET_COLORS[idx],
      };
    });

    const insights: string[] = [];
    const populated = bucketDetails.filter((b) => b.count > 0);
    if (populated.length === 0) {
      insights.push("No patient data yet to generate insights.");
    } else {
      const most = [...populated].sort((a, b) => b.count - a.count)[0];
      insights.push(
        `Most patients are in the ${most.label} age group (${most.count} patient${
          most.count !== 1 ? "s" : ""
        }).`
      );

      const highestRisk = populated
        .filter((b) => b.avgRisk !== null)
        .sort((a, b) => (b.avgRisk ?? 0) - (a.avgRisk ?? 0))[0];
      if (highestRisk && highestRisk.avgRisk !== null) {
        insights.push(
          `Highest average cognitive risk is in the ${highestRisk.label} group (avg ${highestRisk.avgRisk}%).`
        );
      }

      const mostHigh = [...populated].sort((a, b) => b.high - a.high)[0];
      if (mostHigh.high > 0) {
        insights.push(
          `${mostHigh.label} has the most high-risk cases (${mostHigh.high} patient${
            mostHigh.high !== 1 ? "s" : ""
          }).`
        );
      }

      populated
        .filter((b) => b.count > 1 && b.high === b.count)
        .forEach((b) => {
          insights.push(
            `All ${b.count} patients in the ${b.label} group are high-risk — consider prioritising this cohort.`
          );
        });
    }

    return { chartData, bucketDetails, insights };
  }, [patients]);

  const hasAgeData = patients.filter((c) => c.age > 0).length > 0;

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors"
        onClick={() => setOpen((prev) => !prev)}
      >
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h3 className="text-base font-semibold text-foreground">
            Age Distribution & Insights
          </h3>
          {hasAgeData && (
            <span className="rounded-full bg-primary/10 text-primary text-xs font-medium px-2 py-0.5">
              {patients.filter((c) => c.age > 0).length} patients
            </span>
          )}
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
              Loading…
            </div>
          ) : hasAgeData ? (
            <>
              <div>
                <p className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wide">
                  Patient Count by Age Group
                </p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={chartData} barCategoryGap="30%">
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#e5e7eb"
                    />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      width={28}
                    />
                    <Tooltip content={<AgeTooltip />} cursor={{ fill: "#f3f4f6" }} />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wide">
                  Risk Breakdown by Age Group
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {bucketDetails.map((b) => (
                    <div
                      key={b.label}
                      className="rounded-lg border border-border bg-muted/20 p-3 space-y-2"
                    >
                      <div className="flex items-center gap-1.5">
                        <div
                          className="h-3 w-3 rounded-sm flex-shrink-0"
                          style={{ backgroundColor: b.color }}
                        />
                        <span className="text-xs font-semibold text-foreground">
                          {b.label}
                        </span>
                      </div>
                      <div className="text-2xl font-bold text-foreground">
                        {b.count}
                      </div>
                      {b.avgRisk !== null && (
                        <div className="text-xs text-muted-foreground">
                          avg risk{" "}
                          <span className="font-medium text-foreground">
                            {b.avgRisk}%
                          </span>
                        </div>
                      )}
                      {b.count > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {b.high > 0 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded border bg-red-50 text-red-700 border-red-200">
                              {b.high}H
                            </span>
                          )}
                          {b.mod > 0 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded border bg-yellow-50 text-yellow-700 border-yellow-200">
                              {b.mod}M
                            </span>
                          )}
                          {b.low > 0 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded border bg-green-50 text-green-700 border-green-200">
                              {b.low}L
                            </span>
                          )}
                          {b.none > 0 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded border bg-muted text-muted-foreground">
                              {b.none}–
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground mt-2">
                  H = High risk &nbsp;·&nbsp; M = Moderate &nbsp;·&nbsp; L = Low
                  &nbsp;·&nbsp; – = No result yet
                </p>
              </div>

              <div className="rounded-lg bg-primary/5 border border-primary/10 p-4 space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="h-4 w-4 text-primary" />
                  <p className="text-sm font-semibold text-foreground">
                    Key Observations
                  </p>
                </div>
                {insights.map((text, idx) => (
                  <p
                    key={idx}
                    className="text-sm text-muted-foreground flex gap-2"
                  >
                    <span className="text-primary mt-0.5">•</span>
                    {text}
                  </p>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
              No patients with age data available.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
