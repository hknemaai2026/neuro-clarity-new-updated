const fs = require('fs');

const file = 'src/pages/PatientReport.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetStart = `{activeReportTab === "analysis" && (
        <>
        <div ref={reportRef} id="print-report" className="space-y-4 bg-background">`;

const targetEnd = `          <Button
            variant="outline"
            className="gap-2"
            onClick={() => {
              const subject = encodeURIComponent(
                \`Patient Report - \${patientInfo?.patient_info?.name || ''}\`
              );
              const body = encodeURIComponent(
                \`Please find the patient report details below.\\n\\nReport ID: \${reportId || ''}\\nPatient: \${patientInfo?.patient_info?.name || ''}\\nAge/Gender: \${patientInfo?.patient_info?.age || ''} / \${patientInfo?.patient_info?.gender || ''}\\n\`
              );
              window.location.href = \`mailto:?subject=\${subject}&body=\${body}\`;
            }}
          >
            <Mail className="h-4 w-4" />
            Send to Referring Doctor
          </Button>
        </div>`;

const startIdx = content.indexOf(targetStart);
const endIdx = content.indexOf(targetEnd, startIdx);

if (startIdx === -1 || endIdx === -1) {
  console.error('Could not find target boundaries! start:', startIdx, 'end:', endIdx);
  process.exit(1);
}

const fullTarget = content.slice(startIdx, endIdx + targetEnd.length);

const replacement = `{activeReportTab === "analysis" && (
        <Fragment>
          <div ref={reportRef} id="print-report" className="bg-white border border-border rounded-xl overflow-hidden text-sm text-foreground">
            {/* Header */}
            <div className="px-8 py-5 border-b border-border">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">NEMA AI · CognEEG</p>
                  <h1 className="text-lg font-bold text-foreground mt-0.5">EEG Cognitive Neurophysiology Report</h1>
                  <p className="text-xs text-muted-foreground mt-0.5">Research partner: AIIMS New Delhi &nbsp;|&nbsp; For clinical decision support only</p>
                </div>
                <div className="text-right text-xs text-muted-foreground space-y-0.5">
                  <p><span className="font-semibold text-foreground">Patient:</span> {patientInfo?.patient_info?.name || "—"}</p>
                  <p><span className="font-semibold text-foreground">Age / Gender:</span> {patientInfo?.patient_info?.age || "—"} yrs / {patientInfo?.patient_info?.gender || "—"}</p>
                  <p><span className="font-semibold text-foreground">Patient ID:</span> {patientInfo?.patient_info?.id || "—"}</p>
                  <p><span className="font-semibold text-foreground">Report Date:</span> {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</p>
                </div>
              </div>
            </div>

            {/* Impression */}
            <div className="px-8 py-5 border-b border-border">
              <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Impression</h2>
              <p className="leading-relaxed text-foreground">
                EEG-based neurophysiological analysis was performed for{" "}
                <strong>{patientInfo?.patient_info?.name || "the patient"}</strong>,{" "}
                {patientInfo?.patient_info?.age || "—"} years /{" "}
                {patientInfo?.patient_info?.gender || "—"}.{" "}
                The following findings were noted on analysis of the resting-state EEG signal:
              </p>
              {patientInfo?.decline_summary?.band && (
                <p className="mt-3 leading-relaxed text-foreground">{patientInfo.decline_summary.band}</p>
              )}
              <div className="mt-4 grid grid-cols-2 gap-4 border-t border-border pt-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Biomarkers Assessed</p>
                  <p className="mt-1 text-base font-semibold text-foreground">{markerItems.length}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Flagged Findings</p>
                  <p className="mt-1 text-base font-semibold text-foreground">
                    {flaggedCount} <span className="text-xs font-normal text-muted-foreground">of {markerItems.length}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* EEG Biomarker Panel */}
            <div className="px-8 py-5 border-b border-border">
              <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">EEG Biomarker Panel</h2>
              <p className="text-xs text-muted-foreground mb-3">Organised by brain region · Primary markers listed first within each region</p>

              {recordingContext && (
                ((recordingContext.eyes_closed?.eyes_closed_sec ?? 0) > 0 || recordingContext.sleep_markers?.combined_analysis?.quality_label) && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {(recordingContext.eyes_closed?.eyes_closed_sec ?? 0) > 0 && (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-medium text-green-800">
                        <Eye className="h-3 w-3 shrink-0" />
                        Eyes-closed segment: {recordingContext.eyes_closed.eyes_closed_sec}s &nbsp;({recordingContext.eyes_closed.eyes_closed_segments} segment{recordingContext.eyes_closed.eyes_closed_segments !== 1 ? "s" : ""})
                      </span>
                    )}
                    {recordingContext.sleep_markers?.combined_analysis?.quality_label && (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-800">
                        Sleep markers: {formatLabel(recordingContext.sleep_markers.combined_analysis.quality_label)}
                      </span>
                    )}
                    {recordingContext.sleep_markers?.detections && (() => {
                      const det = recordingContext.sleep_markers.detections;
                      const detected = [
                        det.sleep_spindles?.detected && "Spindles",
                        det.vertex_waves?.detected && "Vertex waves",
                        det.k_complexes?.detected && "K-complexes",
                      ].filter(Boolean);
                      return detected.length > 0 ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800">
                          Detected: {detected.join(", ")}
                        </span>
                      ) : null;
                    })()}
                  </div>
                )
              )}

              {Object.keys(regions).length > 0 ? (
                <div className="space-y-6">
                  {regionOrder.filter(rk => regions[rk]).map(rk => {
                    const reg = regions[rk];
                    return (
                      <div key={rk}>
                        <div className="flex items-baseline gap-3 mb-2 pb-2 border-b-2 border-border">
                          <span className="text-sm font-extrabold uppercase tracking-wider text-foreground">{reg.label}</span>
                          <span className="text-xs text-muted-foreground leading-relaxed">{reg.description}</span>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm border-collapse">
                            <thead>
                              <tr className="border-b border-border/40">
                                <th className="text-left py-1.5 pr-4 font-semibold text-muted-foreground text-xs w-1/3">Biomarker</th>
                                <th className="text-left py-1.5 pr-4 font-semibold text-muted-foreground text-xs w-1/8">Value</th>
                                <th className="text-left py-1.5 pr-4 font-semibold text-muted-foreground text-xs w-1/8">Reference</th>
                                <th className="text-left py-1.5 pr-4 font-semibold text-muted-foreground text-xs w-1/12">Status</th>
                                <th className="text-left py-1.5 font-semibold text-muted-foreground text-xs">Clinical Significance</th>
                              </tr>
                            </thead>
                            <tbody>
                              {reg.cards.map((c: any, cIdx: number) => (
                                <tr key={c.id ?? cIdx} className={cn("border-b border-border/30", c.tier === "primary" ? "bg-white" : "bg-muted/10")}>
                                  <td className="py-2.5 pr-4 align-top">
                                    <div className="flex items-start gap-1.5">
                                      {c.tier === "primary" && <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-primary/70 shrink-0" />}
                                      <div>
                                        <p className="font-medium text-foreground leading-snug">{c.label}</p>
                                        {c.description && <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{c.description}</p>}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-2.5 pr-4 align-top">
                                    <span className={cn("font-semibold", c.status === "abnormal" ? "text-red-700" : "text-foreground")}>
                                      {c.value ?? "—"}
                                    </span>
                                  </td>
                                  <td className="py-2.5 pr-4 align-top text-muted-foreground text-xs">
                                    {c.normal_range ?? "—"}
                                  </td>
                                  <td className="py-2.5 pr-4 align-top">
                                    {c.status === "abnormal" ? (
                                      <span className="inline-flex items-center gap-1 text-red-700 font-semibold text-xs">
                                        <span className="h-1.5 w-1.5 rounded-full bg-red-600 shrink-0" /> Abnormal
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 text-muted-foreground text-xs">
                                        <span className="h-1.5 w-1.5 rounded-full bg-gray-400 shrink-0" /> Normal
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-2.5 align-top text-muted-foreground leading-relaxed text-xs">
                                    {c.interpretation ?? "—"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b-2 border-border">
                        <th className="text-left py-2 pr-4 font-semibold text-foreground w-1/3">Biomarker</th>
                        <th className="text-left py-2 pr-4 font-semibold text-foreground w-1/6">Value</th>
                        <th className="text-left py-2 pr-4 font-semibold text-foreground w-1/6">Reference</th>
                        <th className="text-left py-2 pr-4 font-semibold text-foreground w-1/12">Status</th>
                        <th className="text-left py-2 font-semibold text-foreground">Clinical Significance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {markerItems.map((c: any, cIdx: number) => (
                        <tr key={c.id ?? cIdx} className={cn("border-b border-border/50", cIdx % 2 === 0 ? "bg-white" : "bg-muted/20")}>
                          <td className="py-3 pr-4 align-top">
                            <p className="font-medium text-foreground">{c.label}</p>
                            {c.description && <p className="text-xs text-muted-foreground mt-0.5">{c.description}</p>}
                          </td>
                          <td className="py-3 pr-4 align-top">
                            <span className={cn("font-semibold", c.status === "abnormal" ? "text-red-700" : "text-foreground")}>
                              {c.value ?? "—"}
                            </span>
                          </td>
                          <td className="py-3 pr-4 align-top text-muted-foreground">{c.normal_range ?? "—"}</td>
                          <td className="py-3 pr-4 align-top">
                            {c.status === "abnormal" ? (
                              <span className="inline-flex items-center gap-1 text-red-700 font-semibold text-xs">
                                <span className="h-1.5 w-1.5 rounded-full bg-red-600 shrink-0" /> Abnormal
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-muted-foreground text-xs">
                                <span className="h-1.5 w-1.5 rounded-full bg-gray-400 shrink-0" /> Normal
                              </span>
                            )}
                          </td>
                          <td className="py-3 align-top text-muted-foreground leading-relaxed">{c.interpretation ?? "—"}</td>
                        </tr>
                      ))}
                      {markerItems.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-muted-foreground">No biomarker data available.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Clinical Observations & Recommended Correlations */}
            <div className="px-8 py-5 border-b border-border">
              <div className="flex items-start justify-between mb-3">
                <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Clinical Observations &amp; Recommended Correlations</h2>
                {patientInfo?.ai_status === "success" && patientInfo?.ai_recommendation && (
                  <div className="flex gap-2 shrink-0 ml-4">
                    <Button variant="outline" size="sm" className="gap-1 text-xs h-7" onClick={() => setAiRecommendationModalOpen(true)}>
                      <Eye className="h-3 w-3" /> Full Detail
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1 text-xs h-7" onClick={handleAiRecommendationDownload}>
                      <Download className="h-3 w-3" /> Download
                    </Button>
                  </div>
                )}
              </div>
              {isAiRecommendationLoading ? (
                <div className="space-y-2 py-2">
                  <div className="h-2.5 w-full animate-pulse rounded-full bg-muted" />
                  <div className="h-2.5 w-5/6 animate-pulse rounded-full bg-muted" />
                  <div className="h-2.5 w-2/3 animate-pulse rounded-full bg-muted" />
                  <p className="text-xs text-muted-foreground mt-2">Generating clinical observations…</p>
                </div>
              ) : (
                <ol className="space-y-2 list-decimal list-inside">
                  {parseAiSummary(patientInfo?.ai_summary).map((item: string, i: number) => (
                    <li key={i} className="text-foreground leading-relaxed">
                      <span className="text-foreground">{item}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>

            {/* Probable Risk of Cognitive Decline */}
            <div className="px-8 py-5 border-b border-border">
              <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Probable Risk of Cognitive Decline</h2>
              <div className="flex items-start gap-6">
                <div className="shrink-0 text-center border border-border rounded-lg px-5 py-4 min-w-[120px]">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Aggregate Score</p>
                  <p className={cn(
                    "text-3xl font-bold",
                    riskCategory != null && riskCategory.toLowerCase().includes("high") ? "text-red-700" :
                    riskCategory != null && riskCategory.toLowerCase().includes("elevated") ? "text-orange-600" :
                    riskCategory != null && riskCategory.toLowerCase().includes("moderate") ? "text-amber-700" : "text-gray-700"
                  )}>
                    {typeof riskPercentage === "number" ? riskPercentage.toFixed(1) : riskPercentage ?? "—"}%
                  </p>
                  <p className={cn(
                    "mt-1 text-xs font-semibold uppercase tracking-wide",
                    riskCategory != null && riskCategory.toLowerCase().includes("low") ? "text-gray-600" :
                    riskCategory != null && riskCategory.toLowerCase().includes("moderate") ? "text-amber-700" :
                    riskCategory != null && riskCategory.toLowerCase().includes("elevated") ? "text-orange-600" : "text-red-700"
                  )}>
                    {riskCategory ?? "—"}
                  </p>
                </div>
                <div className="flex-1 space-y-2 text-foreground leading-relaxed">
                  <p>
                    The aggregate neurophysiological profile of this patient is consistent with a{" "}
                    <strong>{riskCategory ?? "—"}</strong> probability of cognitive decline, based on comparison with age-matched normative data. The CognEEG model assigns a likelihood score of{" "}
                    <strong>{typeof riskPercentage === "number" ? riskPercentage.toFixed(1) : riskPercentage ?? "—"}%</strong>.
                  </p>
                  <p>
                    This score reflects the aggregate neurophysiological burden observed in the EEG signal and should be considered in conjunction with the individual biomarker findings detailed above. A {riskCategory?.toLowerCase() ?? "—"} aggregate risk does not exclude biomarker-level abnormalities that may warrant clinical attention.
                  </p>
                  <p>
                    <strong>What this means clinically:</strong>{" "}
                    {riskCategory != null && riskCategory.toLowerCase().includes("high")
                      ? "The patient's EEG profile shows neurophysiological patterns significantly above the expected range for their age group. Prompt clinical correlation, cognitive testing, and specialist referral is strongly advised."
                      : riskCategory != null && riskCategory.toLowerCase().includes("elevated")
                      ? "The patient's EEG profile shows patterns above the healthy normative range for their age group. Follow-up assessment and clinical correlation with cognitive history are recommended before drawing conclusions."
                      : riskCategory != null && riskCategory.toLowerCase().includes("moderate")
                      ? "The patient's EEG profile shows mild deviation from expected age-related norms. Clinical review is warranted; a single EEG screening should be interpreted alongside clinical history and cognitive assessment."
                      : "The patient's EEG profile is within or close to the expected range for their age group. Routine monitoring is appropriate; individual biomarker deviations noted above may still benefit from clinical review."}
                  </p>
                </div>
              </div>
            </div>

            {/* Important Notice */}
            <div className="px-8 py-5 bg-muted/30">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Important Notice — Not a Medical Diagnosis</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                This report presents EEG-derived neurophysiological biomarkers as a decision-support tool for qualified clinicians. It is <strong>not a diagnosis</strong> of dementia, mild cognitive impairment, ADHD, or any other neurological condition. Findings must be correlated with clinical history, neurological examination, standardised cognitive testing, medication review, and where indicated, neuroimaging. Interpretation should account for recording quality, patient alertness, sleep status, medications, and medical comorbidities. This report is generated by an AI system validated in collaboration with AIIMS New Delhi and is intended to support — not replace — clinical judgement.
              </p>
            </div>
          </div>

          {/* Export Actions */}
          <div className="flex flex-wrap gap-3">
            <Button className="gap-2" onClick={handleScreenshotPdf}>
              <Download className="h-4 w-4" /> Save Report as PDF
            </Button>
            <Button variant="outline" className="gap-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50" onClick={() => window.open(\`/report/\${reportId}/patient\`, "_blank")}>
              <User className="h-4 w-4" /> Download Patient Copy
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => handleDownload("csv")} disabled={csvDownloadLoading}>
              <Download className="h-4 w-4" /> {csvDownloadLoading ? "Downloading..." : "Download CSV for EMR"}
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => handleDownload("pdf")} disabled={pdfDownloadLoading}>
              <Download className="h-4 w-4" /> {pdfDownloadLoading ? "Downloading..." : "Download PDF for EMR"}
            </Button>
            <Button variant="outline" className="gap-2" onClick={handleDownloadSummaryCard}>
              <Download className="h-4 w-4" /> Download Summary Card (PNG)
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => {
                const subject = encodeURIComponent(
                  \`Patient Report - \${patientInfo?.patient_info?.name || ''}\`
                );
                const body = encodeURIComponent(
                  \`Please find the patient report details below.\\n\\nReport ID: \${reportId || ''}\\nPatient: \${patientInfo?.patient_info?.name || ''}\\nAge/Gender: \${patientInfo?.patient_info?.age || ''} / \${patientInfo?.patient_info?.gender || ''}\\n\`
                );
                window.location.href = \`mailto:?subject=\${subject}&body=\${body}\`;
              }}
            >
              <Mail className="h-4 w-4" /> Send to Referring Doctor
            </Button>
          </div>`;

content = content.replace(fullTarget, replacement);
fs.writeFileSync(file, content, 'utf8');
console.log('Successfully updated PatientReport.tsx!');
