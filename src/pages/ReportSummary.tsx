import React, { useEffect, useRef, useState } from "react";
import { useParams, useLocation, useSearchParams } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageLoader } from "@/components/ui/loader";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { API_BASE_URL } from "@/app/config";
import { cn } from "@/lib/utils";
import { AlertCircle, Brain } from "lucide-react";

interface ReportSummaryProps {
  embedded?: boolean;
  embeddedResultId?: string;
}

export const ReportSummary: React.FC<ReportSummaryProps> = ({
  embedded = false,
  embeddedResultId,
}) => {
  const { resultId: resultIdParam } = useParams();
  const location = useLocation();
  const resultId =
    embeddedResultId ||
    (resultIdParam ? decodeURIComponent(resultIdParam) : undefined) ||
    location.state?.resultId;

  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [reportData, setReportData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);
  const [searchParams] = useSearchParams();
  const autoPrint = searchParams.get("print") === "1";
  const POLL_INTERVAL_MS = 5000;
  const MAX_POLL_ATTEMPTS = 24;

  const wrapContent = (content: React.ReactNode) =>
    embedded ? <>{content}</> : <MainLayout>{content}</MainLayout>;

  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let attempts = 0;

    const load = async () => {
      if (!resultId) {
        setError("Missing result ID in the URL.");
        setLoading(false);
        return;
      }
      try {
        attempts += 1;
        const res = await fetchWithAuth(
          `${API_BASE_URL}/report-summary/data/${encodeURIComponent(resultId)}`
        );
        if (!res.ok) throw new Error(`Request failed (${res.status})`);
        const data = await res.json();
        if (cancelled) return;
        setStatus(data.status);
        if (data.status === "success" && data.report_data) {
          setReportData(data.report_data);
          setLoading(false);
        } else {
          setReportData(null);
          const maxAttempts = embedded ? 3 : MAX_POLL_ATTEMPTS;
          if (attempts < maxAttempts) {
            timeoutId = setTimeout(load, POLL_INTERVAL_MS);
          } else {
            setLoading(false);
          }
        }
      } catch (err: any) {
        if (!cancelled && attempts < (embedded ? 3 : MAX_POLL_ATTEMPTS)) {
          timeoutId = setTimeout(load, POLL_INTERVAL_MS);
        } else if (!cancelled) {
          setError(err?.message || "Failed to load report summary.");
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [resultId, embedded]);

  if (loading) {
    return wrapContent(<PageLoader text="Loading report summary..." />);
  }

  if (error) {
    return wrapContent(
      <div className="grid justify-items-center content-center py-16 text-center">
        <AlertCircle className="h-12 w-12 text-destructive mb-3" />
        <p className="text-destructive font-medium">{error}</p>
      </div>
    );
  }

  if (status === "processing" || !reportData) {
    return wrapContent(
      <div
        className="grid justify-items-center content-center py-20 text-center"
        style={{ display: "flex", alignItems: "center" }}
      >
        <div className="h-16 w-16 rounded-full bg-primary/10 grid place-items-center mb-4">
          <Brain className="h-8 w-8 text-primary animate-pulse" />
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Clinical interpretation is still being prepared.
        </h2>
        <p className="text-sm text-muted-foreground">
          Please check back in a moment.
        </p>
      </div>
    );
  }

  const patient = reportData.patient_information || {};
  const assessment = reportData.overall_assessment || {};
  const clinicalInterp = reportData.clinical_interpretation || {};
  const declineAssessment = reportData.cognitive_decline_assessment || {};
  const followup = reportData.recommended_followup || {};
  const clinicalNote = reportData.clinical_note || {};

  const clinicalRecs =
    Array.isArray(followup.clinical_recommendations) &&
    followup.clinical_recommendations.length > 0
      ? followup.clinical_recommendations
      : [
          "Comprehensive Neuropsychological Assessment",
          "Brain Imaging (MRI / PET as indicated)",
          "Neurology Consultation",
          "Movement Disorder Evaluation (if applicable)",
          "Longitudinal Monitoring",
        ];

  const summaryParagraphs: string[] = Array.isArray(clinicalInterp.summary)
    ? clinicalInterp.summary
    : clinicalInterp.summary
    ? [clinicalInterp.summary]
    : [];

  const routing = reportData.clinical_routing;
  const urgencyCls = ((routing?.urgency || "").toLowerCase().includes("prompt"))
    ? "bg-red-100 text-red-700 border-red-200"
    : ((routing?.urgency || "").toLowerCase().includes("elective"))
    ? "bg-amber-100 text-amber-700 border-amber-200"
    : "bg-green-100 text-green-700 border-green-200";

  return wrapContent(
    <React.Fragment>
      <style>
        {`@media print { #print-report { width: 100% !important; box-shadow: none !important; } #print-report * { -webkit-print-color-adjust: exact !important; } }`}
      </style>
      <div className="space-y-4">
        <div ref={reportRef} id="print-report">
          <div className="bg-white border border-border rounded-xl overflow-hidden text-sm text-foreground">
            {/* Header */}
            <div className="px-8 py-5 border-b border-border">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    NEMA AI · CognEEG
                  </p>
                  <h1 className="text-lg font-bold text-foreground mt-0.5">
                    Findings &amp; Summary
                  </h1>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Research partner: AIIMS New Delhi &nbsp;·&nbsp; For clinical decision support only
                  </p>
                </div>
                <div className="text-right text-xs text-muted-foreground space-y-0.5">
                  <p>
                    <span className="font-semibold text-foreground">Patient ID:</span>{" "}
                    {patient.patient_id || "—"}
                  </p>
                  <p>
                    <span className="font-semibold text-foreground">Age / Gender:</span>{" "}
                    {patient.age || "—"} yrs / {patient.gender || "—"}
                  </p>
                  <p>
                    <span className="font-semibold text-foreground">Assessment Date:</span>{" "}
                    {patient.assessment_date || "—"}
                  </p>
                  <p>
                    <span className="font-semibold text-foreground">Report Date:</span>{" "}
                    {new Date().toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Analysis */}
            <div className="px-8 py-6 border-b border-border space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Analysis
              </h2>
              <p className="leading-relaxed text-foreground">
                Resting-state EEG neurophysiological analysis was completed for Patient{" "}
                <strong>{patient.patient_id || "—"}</strong> ({patient.age || "—"} yrs /{" "}
                {patient.gender || "—"}), assessed on {patient.assessment_date || "—"}.
              </p>
              {summaryParagraphs[0] && (
                <p className="leading-relaxed text-foreground">{summaryParagraphs[0]}</p>
              )}
              {summaryParagraphs[1] && (
                <p className="leading-relaxed text-foreground">{summaryParagraphs[1]}</p>
              )}
              {declineAssessment.dementia_likelihood && (
                <p className="leading-relaxed text-foreground text-sm text-muted-foreground italic">
                  {declineAssessment.dementia_likelihood}
                </p>
              )}
            </div>

            {/* Next Steps */}
            <div className="px-8 py-6 border-b border-border space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Next Steps
              </h2>
              {routing && (
                <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-foreground">
                      Recommended Referral:
                    </span>
                    <span className="font-semibold text-foreground">
                      {routing.specialist || "—"}
                    </span>
                    {routing.urgency && (
                      <span
                        className={cn(
                          "text-xs font-medium px-2 py-0.5 rounded-full border",
                          urgencyCls
                        )}
                      >
                        {routing.urgency}
                      </span>
                    )}
                  </div>
                  {routing.rationale && (
                    <p className="text-sm leading-relaxed text-foreground">
                      {routing.rationale}
                    </p>
                  )}
                </div>
              )}
              {clinicalRecs.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Additional Recommendations
                  </p>
                  <ul className="space-y-1.5">
                    {clinicalRecs.map((rec: string, idx: number) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 text-sm text-foreground"
                      >
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* About This Report */}
            <div className="px-8 py-6 border-b border-border space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                About This Report
              </h2>
              <p className="leading-relaxed text-foreground">
                This report is generated by the NEMA AI CognEEG platform, a neurophysiological decision-support tool developed and validated in collaboration with AIIMS New Delhi. The biomarker scores and risk indicators presented here are derived from a resting-state EEG recording and reflect statistical deviations from age-matched normative data. They are intended solely to assist a qualified clinician in clinical reasoning.
              </p>
              <p className="leading-relaxed text-foreground">
                The output of this system is probabilistic and subject to the inherent limitations of EEG-based assessment — including recording quality, patient cooperation, medications, sleep status, and medical comorbidities. All findings require correlation with clinical history, neurological examination, standardised neuropsychological testing, and — where indicated — neuroimaging. The responsibility for clinical interpretation and any resulting clinical decisions rests entirely with the treating clinician. NEMA AI does not make clinical diagnoses and accepts no clinical liability for decisions made on the basis of this report alone.
              </p>
            </div>

            {/* Not a Medical Diagnosis */}
            <div className="px-8 py-5 bg-muted/30">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                Not a Medical Diagnosis
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {clinicalNote.important_notice ||
                  "These EEG-derived findings are neurophysiological indicators only and do not constitute a medical diagnosis. This report is intended to support — not replace — qualified clinical judgement."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
};

export default ReportSummary;
