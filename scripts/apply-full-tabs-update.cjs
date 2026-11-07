const fs = require('fs');

const filePath = 'src/pages/PatientReport.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add imports if not present
if (!content.includes('BrainStatesView')) {
  content = content.replace(
    'import ReportSummary from "./ReportSummary";',
    `import ReportSummary from "./ReportSummary";
import { BrainStatesView } from "@/components/report/BrainStatesView";
import { ClinicalInsightsView } from "@/components/report/ClinicalInsightsView";
import { PersonalisedPlanView } from "@/components/report/PersonalisedPlanView";`
  );
}

// 2. Update activeReportTab state definition and add age profile / brain states state
const oldState = 'const [activeReportTab, setActiveReportTab] = useState<"summary" | "analysis" | "normative" | "brainstates" | "insights" | "myplan">("analysis");';
const newState = `const [activeReportTab, setActiveReportTab] = useState<
    "summary" | "analysis" | "age_profile" | "brain_states" | "clinical_insights" | "personalised"
  >("analysis");
  const [ageProfileData, setAgeProfileData] = useState<any>(null);
  const [ageProfileLoading, setAgeProfileLoading] = useState(false);
  const [ageProfileError, setAgeProfileError] = useState<string | null>(null);
  const [brainStatesLoading, setBrainStatesLoading] = useState(false);
  const [brainStatesError, setBrainStatesError] = useState<string | null>(null);`;

if (content.includes(oldState)) {
  content = content.replace(oldState, newState);
}

// 3. Add age profile and brain states useEffect hooks after feature flags fetch
const targetEffect = 'setEnabledFeatures(prev => prev ? new Set([...prev, ...keys.filter(Boolean)]) : new Set(keys.filter(Boolean)));\n      })\n      .catch(() => { /* silently keep null → all tabs visible */ });\n  }, []);';

const effectsToAdd = `

  useEffect(() => {
    if (activeReportTab === "age_profile" && summaryResultId && !ageProfileData && !ageProfileLoading) {
      setAgeProfileLoading(true);
      setAgeProfileError(null);
      fetchWithAuth(\`\${API_BASE_URL}/age-profile/\${encodeURIComponent(String(summaryResultId))}\`)
        .then(async (res) => {
          const data = await res.json();
          if (res.ok) {
            setAgeProfileData(data);
          } else {
            setAgeProfileError(data?.error || "Failed to load age profile.");
          }
        })
        .catch(() => setAgeProfileError("Network error — could not load age profile."))
        .finally(() => setAgeProfileLoading(false));
    }
  }, [activeReportTab, summaryResultId, ageProfileData, ageProfileLoading]);

  useEffect(() => {
    if (activeReportTab === "brain_states" && reportId && !brainStatesData && !brainStatesLoading) {
      setBrainStatesLoading(true);
      setBrainStatesError(null);
      fetchWithAuth(\`\${API_BASE_URL}/v1/brain-states/\${encodeURIComponent(String(reportId))}\`)
        .then(async (res) => {
          const data = await res.json();
          if (res.ok) {
            setBrainStatesData(data);
          } else {
            setBrainStatesError(data?.error || data?.detail || "Failed to load brain state data.");
          }
        })
        .catch(() => setBrainStatesError("Network error — could not load brain state data."))
        .finally(() => setBrainStatesLoading(false));
    }
  }, [activeReportTab, reportId, brainStatesData, brainStatesLoading]);`;

if (content.includes(targetEffect) && !content.includes('/age-profile/')) {
  content = content.replace(targetEffect, targetEffect + effectsToAdd);
}

// 4. Update tab button callbacks
content = content.replace('onClick={() => setActiveReportTab("normative")}', 'onClick={() => setActiveReportTab("age_profile")}');
content = content.replace('activeReportTab === "normative"', 'activeReportTab === "age_profile"');

content = content.replace('onClick={() => setActiveReportTab("brainstates")}', 'onClick={() => setActiveReportTab("brain_states")}');
content = content.replace('activeReportTab === "brainstates"', 'activeReportTab === "brain_states"');

content = content.replace('onClick={() => setActiveReportTab("insights")}', 'onClick={() => setActiveReportTab("clinical_insights")}');
content = content.replace('activeReportTab === "insights"', 'activeReportTab === "clinical_insights"');

content = content.replace('onClick={() => setActiveReportTab("myplan")}', 'onClick={() => setActiveReportTab("personalised")}');
content = content.replace('activeReportTab === "myplan"', 'activeReportTab === "personalised"');

// 5. Replace legacy mockup tab bodies (from `{/* ── Findings & Summary ── Clinical narrative report ── */}` down to `{/* ── Cognitive Analysis — PDF design ── */}\n        {activeReportTab === "analysis" && (\n        <Fragment>`)
const startMarker = '{/* ── Findings & Summary ── Clinical narrative report ── */}';
const endMarker = '{/* ── Cognitive Analysis — PDF design ── */}\n        {activeReportTab === "analysis" && (\n        <Fragment>';

const startIdx = content.indexOf(startMarker);
const endIdx = content.indexOf(endMarker);

console.log('startIdx:', startIdx, 'endIdx:', endIdx);

if (startIdx !== -1 && endIdx !== -1) {
  const replacementJSX = `{activeReportTab === "age_profile" ? (
          <div className="space-y-6">
            {ageProfileLoading && (
              <div className="flex items-center justify-center py-16 text-muted-foreground gap-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                <span className="text-sm">Loading age normative data…</span>
              </div>
            )}
            {ageProfileError && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-5 py-4 text-sm text-destructive">
                {ageProfileError}
              </div>
            )}
            {ageProfileData && !ageProfileLoading && (() => {
              const p = ageProfileData;
              const statusBadgeStyles: Record<string, string> = {
                within_norm: "bg-green-100 text-green-800 border-green-300",
                slightly_above: "bg-yellow-100 text-yellow-800 border-yellow-300",
                moderately_above: "bg-orange-100 text-orange-800 border-orange-300",
                significantly_above: "bg-red-100 text-red-800 border-red-300",
              };
              const statusLabels: Record<string, string> = {
                within_norm: "Within Normal Range",
                slightly_above: "Slightly Above Norm",
                moderately_above: "Moderately Above Norm",
                significantly_above: "Significantly Above Norm",
              };
              const chartData = p.all_bands.map((b: any) => ({
                label: b.label,
                base: b.norm_min,
                range: b.norm_max - b.norm_min,
                isPatient: b.is_patient_band,
              }));

              return (
                <Fragment>
                  <div className="rounded-xl border border-border bg-card px-7 py-5 shadow-sm">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                          Age Normative Context
                        </p>
                        <h2 className="mt-1 text-base font-semibold text-foreground">
                          Patient age: <span className="text-primary">{p.age} yrs</span>&nbsp;·&nbsp;
                          Age band: <span className="text-primary">{p.age_band}</span>&nbsp;·&nbsp;
                          Norm range: <span className="text-primary">{p.norm_min}–{p.norm_max}%</span>
                        </h2>
                      </div>
                      <span className={cn("mt-2 sm:mt-0 inline-block self-start rounded-full border px-3 py-1 text-xs font-semibold", statusBadgeStyles[p.deviation_level] ?? "bg-muted text-muted-foreground border-border")}>
                        {statusLabels[p.deviation_level] ?? formatLabel(p.deviation_level)}
                      </span>
                    </div>
                    <p className="mt-4 text-sm leading-relaxed text-foreground">{p.interpretation}</p>
                  </div>

                  <div className="rounded-xl border border-border bg-card px-7 py-5 shadow-sm">
                    <p className="mb-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      Risk Score vs. Healthy Age-Peer Norms
                    </p>
                    <p className="mb-4 text-xs text-muted-foreground">
                      Green bars = healthy normative range per age group. Red line = this patient's score ({p.risk_percent}%).
                    </p>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="label" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                        <YAxis domain={[0, 100]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} tickFormatter={(val) => \`\${val}%\`} />
                        <Tooltip
                          formatter={(val, name, item: any) => {
                            if (name === "base") return null;
                            const pl = item.payload;
                            return [\`\${pl.base}–\${pl.base + pl.range}%\`, "Healthy norm"];
                          }}
                          labelFormatter={(val) => \`Age group: \${val}\`}
                          contentStyle={{ fontSize: 12, borderRadius: 6 }}
                        />
                        <Bar dataKey="base" stackId="norm" fill="transparent" isAnimationActive={false} />
                        <Bar dataKey="range" stackId="norm" radius={[3, 3, 0, 0]} isAnimationActive={false}>
                          {chartData.map((entry: any, idx: number) => (
                            <Cell
                              key={idx}
                              fill={entry.isPatient ? "#16a34a" : "#bbf7d0"}
                              strokeWidth={entry.isPatient ? 2 : 0}
                              stroke={entry.isPatient ? "#15803d" : "none"}
                            />
                          ))}
                        </Bar>
                        <ReferenceLine
                          y={p.risk_percent}
                          stroke="#dc2626"
                          strokeWidth={2}
                          strokeDasharray="5 4"
                          label={{ value: \`\${p.risk_percent}%\`, position: "right", fill: "#dc2626", fontSize: 11, fontWeight: 600 }}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                    <p className="mt-2 text-xs text-muted-foreground italic">
                      Darker green bar = patient's age band ({p.age_band}). Dashed red line = patient's current score.
                    </p>
                  </div>

                  <div className="rounded-xl border border-border bg-muted/20 px-7 py-5 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                      About This Age Group
                    </p>
                    <p className="text-sm leading-relaxed text-foreground">{p.band_description}</p>
                  </div>

                  {p.next_steps?.length > 0 && (
                    <div className="rounded-xl border border-border bg-card px-7 py-5 shadow-sm">
                      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                        Clinical Guidance
                      </p>
                      <ol className="space-y-2 list-decimal list-inside">
                        {p.next_steps.map((step: string, idx: number) => (
                          <li key={idx} className="text-sm leading-relaxed text-foreground">{step}</li>
                        ))}
                      </ol>
                    </div>
                  )}

                  <div className="rounded-xl border border-border bg-muted/30 px-7 py-4">
                    <p className="text-xs text-muted-foreground leading-relaxed">{p.disclaimer}</p>
                  </div>

                  {p.references?.length > 0 && (
                    <div className="rounded-xl border border-border/50 bg-muted/10 px-7 py-4">
                      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                        Research References
                      </p>
                      <ol className="space-y-1.5">
                        {p.references.map((ref: any) => (
                          <li key={ref.id} className="text-xs text-muted-foreground leading-relaxed">
                            <span className="font-semibold text-foreground">{ref.id}</span> {ref.authors} ({ref.year}). {ref.title}. <em>{ref.journal}</em>.
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </Fragment>
              );
            })()}
          </div>
        ) : activeReportTab === "brain_states" ? (
          <BrainStatesView loading={brainStatesLoading} error={brainStatesError} data={brainStatesData} />
        ) : activeReportTab === "clinical_insights" ? (
          <ClinicalInsightsView markerItems={markerItems} regionData={regions} riskCategory={riskCategory} riskPercentage={riskPercentage} />
        ) : activeReportTab === "personalised" ? (
          <PersonalisedPlanView patientInfo={patientInfo} markerItems={markerItems} regionData={regions} riskCategory={riskCategory} riskPercentage={riskPercentage} />
        ) : activeReportTab === "summary" ? (
          <div className="space-y-4">
            <div ref={reportRef} className="bg-background">
              {summaryResultId ? (
                <ReportSummary embedded={true} embeddedResultId={String(summaryResultId)} />
              ) : (
                <PageLoader text="Waiting for report summary..." />
              )}
            </div>
            {summaryResultId && (
              <div className="flex flex-wrap gap-3">
                <Button className="gap-2" onClick={() => { setDownloadError(null); window.print(); }}>
                  <Download className="h-4 w-4" />
                  Save Report as PDF
                </Button>
              </div>
            )}
          </div>
        ) : (
        <Fragment>`;

  content = content.slice(0, startIdx) + replacementJSX + content.slice(endIdx + endMarker.length);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Successfully applied tabs update!');
} else {
  console.error('Could not find markers!');
}
