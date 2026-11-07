import { useEffect, useState, useRef, Fragment } from "react";
import { useParams, useLocation } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/ui/loader";
import { historypreview } from "@/app/patients";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Brain,
  Calendar,
  Download,
  Mail,
  Printer,
  ChevronDown,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  Info,
  Activity,
  Eye,
  CheckCircle2,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { API_BASE_URL } from "@/app/config";
import { downloadPrescription, getFileExtension } from "@/app/reports";
import ReportSummary from "./ReportSummary";
import { BrainStatesView } from "@/components/report/BrainStatesView";
import { ClinicalInsightsView } from "@/components/report/ClinicalInsightsView";
import { PersonalisedPlanView } from "@/components/report/PersonalisedPlanView";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import EEGScanReport from "@/components/eegscanReport";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  ReferenceLine,
} from "recharts";

const initialPatientData = {
  id: "",
  name: "",
  age: 0,
  sex: "",
  screeningDate: "",
  riskLevel: "low" as const,
  probability: 0,
  brainAge: 0,
  signalQuality: 0,
  interpretation: "",
};

const initialCognitiveMarkers = [
  {
    title: "Cognitive Decline Index",
    subtitle: "Slow/Fast Wave Ratio",
    value: "1.8",
    normalRange: "0.8–1.2",
    interpretation: "Higher than expected — suggests early slowing of brain activity.",
    trend: "up" as const,
    percentile: 82,
  },
  {
    title: "Posterior Dominant Rhythm",
    subtitle: "PDR Frequency",
    value: "8.1 Hz",
    normalRange: "9.5–10 Hz",
    interpretation: "PDR slowing detected — common in early cognitive decline.",
    trend: "down" as const,
    percentile: 20,
  },
  {
    title: "Memory-Related Pattern",
    subtitle: "Theta/Alpha Ratio",
    value: "Elevated",
    normalRange: "Age-matched norms",
    interpretation: "Mild deviation from age norms — may indicate memory processing changes.",
    trend: "up" as const,
    percentile: 68,
  },
  {
    title: "Frontal Executive Function",
    subtitle: "Theta/Beta Ratio",
    value: "2.4",
    normalRange: "1.5–2.0",
    interpretation: "Elevated — often associated with executive dysfunction.",
    trend: "up" as const,
    percentile: 75,
  },
  {
    title: "Arousal Stability Index",
    subtitle: "Alertness Consistency",
    value: "Normal",
    normalRange: "Within range",
    interpretation: "Within normal range — no significant arousal abnormalities.",
    trend: "stable" as const,
    percentile: 55,
  },
  {
    title: "Interhemispheric Asymmetry",
    subtitle: "Left-Right Balance",
    value: "Asymmetric",
    normalRange: "Symmetric",
    interpretation: "Left temporal slowing noted — localized abnormality detected.",
    trend: "down" as const,
    percentile: 30,
  },
  {
    title: "Sleep Dysregulation Index",
    subtitle: "Sleep Pattern Markers",
    value: "Moderate",
    normalRange: "Low",
    interpretation: "Moderately elevated — may indicate sleep-related cognitive impact.",
    trend: "up" as const,
    percentile: 65,
  },
  {
    title: "Gamma Activity Ratio",
    subtitle: "High-frequency Activity",
    value: "Normal",
    normalRange: "Age-appropriate",
    interpretation: "Within normal parameters — high-frequency processing intact.",
    trend: "stable" as const,
    percentile: 48,
  },
];

const initialBrainAgeData = [
  { date: "Jan 23", brainAge: 72, chronoAge: 67 },
  { date: "Apr 23", brainAge: 73, chronoAge: 67.3 },
  { date: "Jul 23", brainAge: 74, chronoAge: 67.5 },
  { date: "Oct 23", brainAge: 75, chronoAge: 67.8 },
  { date: "Jan 24", brainAge: 76, chronoAge: 68 },
];

const initialRiskTrendData = [
  { date: "Jan 23", risk: 58 },
  { date: "Apr 23", risk: 62 },
  { date: "Jul 23", risk: 68 },
  { date: "Oct 23", risk: 72 },
  { date: "Jan 24", risk: 78 },
];

const initialPercentileData = [
  { name: "PDR", value: 20 },
  { name: "CDI", value: 82 },
  { name: "Memory", value: 68 },
  { name: "Executive", value: 75 },
  { name: "Asymmetry", value: 30 },
];

const recommendations = [
  "Consider routine neuropsychological evaluation to establish baseline.",
  "Follow-up EEG screening recommended in 6 months.",
  "If symptoms progress, consider referral to neurology.",
  "Lifestyle factors (sleep, exercise, diet) may influence EEG patterns.",
];

const TrendIcon = ({ trend }: { trend: "up" | "down" | "stable" }) => {
  switch (trend) {
    case "up":
      return <TrendingUp className="h-4 w-4 text-risk-moderate" />;
    case "down":
      return <TrendingDown className="h-4 w-4 text-risk-high" />;
    default:
      return <Minus className="h-4 w-4 text-muted-foreground" />;
  }
};

const PatientReport = () => {
  const { jobId: jobIdParam } = useParams();
  const location = useLocation();
  const jobId = jobIdParam ? decodeURIComponent(jobIdParam) : undefined;
  const [graphsExpanded, setGraphsExpanded] = useState(false);
  const [explainabilityExpanded, setExplainabilityExpanded] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  
  // Check if navigated from patient history page
  const fromPatientHistory = location.state?.fromPatientHistory || false;
  const reportId = location.state?.reportId ? decodeURIComponent(location.state.reportId) : jobId;
  const POLL_INTERVAL_MS = 5000;

  const [patientData, setPatientData] = useState(initialPatientData);
  const [cognitiveMarkers, setCognitiveMarkers] = useState<any>(initialCognitiveMarkers);
  const [brainAgeData, setBrainAgeData] = useState(initialBrainAgeData);
  const [riskTrendData, setRiskTrendData] = useState(initialRiskTrendData);
  const [graphData, setGraphData] = useState(null);
  const [brainStatesData, setBrainStatesData] = useState<any>(null);
  const [csvDownloadLoading, setCsvDownloadLoading] = useState(false);
  const [pdfDownloadLoading, setPdfDownloadLoading] = useState(false);
  const [screenshotPdfLoading, setScreenshotPdfLoading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeReportTab, setActiveReportTab] = useState<
    "summary" | "analysis" | "age_profile" | "brain_states" | "clinical_insights" | "personalised"
  >(location.state?.tab || "summary");
  const [ageProfileData, setAgeProfileData] = useState<any>(null);
  const [ageProfileLoading, setAgeProfileLoading] = useState(false);
  const [ageProfileError, setAgeProfileError] = useState<string | null>(null);
  const [brainStatesLoading, setBrainStatesLoading] = useState(false);
  const [brainStatesError, setBrainStatesError] = useState<string | null>(null);
  const [enabledFeatures, setEnabledFeatures] = useState<Set<string> | null>(null); // null = not yet fetched (show all)
  
  // Prescription modal state
  const [prescriptionModalOpen, setPrescriptionModalOpen] = useState(false);
  const [currentPrescription, setCurrentPrescription] = useState<{ url: string; blob: Blob; fileName: string; textContent?: string } | null>(null);
  const [prescriptionLoading, setPrescriptionLoading] = useState(false);
  
  // AI Recommendation modal state
  const [aiRecommendationModalOpen, setAiRecommendationModalOpen] = useState(false);
  const [patientInfo, setPatientInfo] = useState<any>({
    patient_info: {
      name: "",
      age: 0,
      gender: "",
      id: "",
      mmse_score: "",
      moca_score: "",
      notes: "",
    },
    decline_summary: {
      band: "",
      percent: 0,
    },
    rf_risk: {
      category: "",
      percentage: 0,
      probability: 0,
      model: "",
    },
  });
  const summaryResultId =
    patientInfo?.result_id ??
    patientInfo?.resultId ??
    patientInfo?.report?.result_id ??
    patientInfo?.data?.result_id ??
    reportId ??
    null;

  console.log('summaryResultId:', summaryResultId, 'fromPatientHistory:', fromPatientHistory, 'reportId:', reportId);

  const getRiskBadgeVariant = (level: string) => {
    if (!level) return "secondary";
    const key = level.toLowerCase();
    if (key.includes("high")) return "riskHigh";
    if (key.includes("moderate")) return "riskModerate";
    if (key.includes("low")) return "riskLow";
    return "secondary";
  };

  const [features, setFeatures] = useState<Record<string, boolean>>({});

  // Fetch feature flags to control tab visibility
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetch(`${API_BASE_URL}/me/features`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(r => r.ok ? r.json() : null)
        .then(d => {
          if (d?.features) {
            setFeatures(d.features);
            setEnabledFeatures(new Set(Object.entries(d.features).filter(([, v]) => v).map(([k]) => k)));
          }
        })
        .catch(() => {});
    }

    fetchWithAuth(`${API_BASE_URL}/hospitals/features`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d) return;
        const keys: string[] = Array.isArray(d)
          ? d.map((f: any) => (typeof f === "string" ? f : f.key ?? f.name ?? f.id))
          : Array.isArray(d.features)
            ? d.features.map((f: any) => (typeof f === "string" ? f : f.key ?? f.name))
            : Object.entries(d.features ?? d).filter(([, v]) => v).map(([k]) => k);
        setEnabledFeatures(prev => prev ? new Set([...prev, ...keys.filter(Boolean)]) : new Set(keys.filter(Boolean)));
      })
      .catch(() => { /* silently keep null → all tabs visible */ });
  }, []);

  useEffect(() => {
    if (activeReportTab === "age_profile" && summaryResultId && !ageProfileData && !ageProfileLoading) {
      setAgeProfileLoading(true);
      setAgeProfileError(null);
      fetchWithAuth(`${API_BASE_URL}/age-profile/${encodeURIComponent(String(summaryResultId))}`)
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
      fetchWithAuth(`${API_BASE_URL}/v1/brain-states/${encodeURIComponent(String(reportId))}`)
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
  }, [activeReportTab, reportId, brainStatesData, brainStatesLoading]);

  const hasFeature = (f: string) => features[f] !== false;

  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const loadCardAndGraphData = async () => {
      if (!reportId) return;

      try {
        let cardsData;
        const encodedJobId = reportId ? encodeURIComponent(reportId) : "";
        
        if (fromPatientHistory) {
          // If navigated from patient history, call historypreview API
          cardsData = await historypreview(reportId, {});
        } else {
          // First try regular report API (for active pipeline jobs)
          try {
            const cardsRes = await fetchWithAuth(`${API_BASE_URL}/report/${encodedJobId}`);
            if (cardsRes.ok) {
              cardsData = await cardsRes.json();
            }
          } catch {}

          // Fallback to historypreview (for completed screening records)
          if (!cardsData || (!cardsData.cards && !cardsData.patient_info && !cardsData.rf_risk)) {
            try {
              const histData = await historypreview(reportId, {});
              if (histData && (histData.cards || histData.patient_info || histData.rf_risk)) {
                cardsData = histData;
              }
            } catch {}
          }
        }

        const hasReportData = Boolean(cardsData?.cards || cardsData?.patient_info || cardsData?.rf_risk);

        if (cardsData && hasReportData) {
          setCognitiveMarkers(cardsData.cards ?? cardsData);
          setPatientInfo(cardsData);
        } else {
          if (!cancelled) {
            setError("EEG processing failed. Please try uploading again.");
            setIsLoading(false);
          }
          return;
        }

        if (!cancelled) {
          setIsLoading(false);
        }

        const graphsRes = await fetchWithAuth(`${API_BASE_URL}/graphs/${encodedJobId}`);
        if (graphsRes.ok) {
          const graphDataResponse = await graphsRes.json();
          setGraphData(graphDataResponse);
        }

        // Fetch brain states
        try {
          const bsRes = await fetchWithAuth(`${API_BASE_URL}/v1/brain-states/${encodedJobId}`);
          if (bsRes.ok) {
            const bsData = await bsRes.json();
            console.log("[BrainStates] API response:", JSON.stringify(bsData).slice(0, 500));
            setBrainStatesData(bsData);
          } else {
            console.warn("[BrainStates] API returned", bsRes.status, "for", `/v1/brain-states/${encodedJobId}`);
          }
        } catch (_) {
          // brain states optional — fail silently
        }

        if (!cancelled) {
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error loading report data:", error);
        if (!cancelled) {
          setError("EEG processing failed. Please try uploading again.");
          setIsLoading(false);
        }
      }
    };

    loadCardAndGraphData();
    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [fromPatientHistory, reportId]);

  // historypreview(jobId).then((data) => {
  //   console.log(data, "historypreview");
  // });


  const handleDownload = async (format: "pdf" | "csv" = "pdf") => {
    if (!reportId) {
      console.error("No reportId available for download");
      setDownloadError("No report ID available. Please try refreshing the page.");
      return;
    }

    // Set appropriate loading state based on format
    if (format === "csv") {
      setCsvDownloadLoading(true);
    } else {
      setPdfDownloadLoading(true);
    }
    setDownloadError(null);

    try {
      const encodedReportId = reportId ? encodeURIComponent(reportId) : "";
      const endpoint = `${API_BASE_URL}/download/${encodedReportId}${format === "csv" ? "?format=csv" : ""}`;
      console.log("Attempting download from:", endpoint);
      
      const res = await fetchWithAuth(endpoint);
      console.log("Download response status:", res.status);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error("Download failed with response:", errorText);
        throw new Error(`Download request failed: ${res.status} ${errorText}`);
      }

      const blob = await res.blob();
      console.log("Download blob size:", blob.size, "type:", blob.type);
      
      if (blob.size === 0) {
        throw new Error("Downloaded file is empty");
      }

      // Method 1: Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `patient_report_${reportId}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      
      console.log("Download completed successfully");
    } catch (error) {
      console.error("Failed to download report:", error);
      
      // Try alternative method if first fails
      try {
        console.log("Trying alternative download method...");
        const encodedReportId = reportId ? encodeURIComponent(reportId) : "";
        const endpoint = `${API_BASE_URL}/download/${encodedReportId}${format === "csv" ? "?format=csv" : ""}`;
        
        // Open in new tab as fallback
        window.open(endpoint, '_blank');
        setDownloadError("Download opened in new tab. Please save it manually.");
      } catch (fallbackError) {
        console.error("Alternative download also failed:", fallbackError);
        setDownloadError(`Download failed: ${error.message || 'Unknown error'}. Please try again or check your internet connection.`);
      }
    } finally {
      // Reset appropriate loading state based on format
      if (format === "csv") {
        setCsvDownloadLoading(false);
      } else {
        setPdfDownloadLoading(false);
      }
    }
  };

  const handleDownloadSummaryCard = async () => {
    if (!reportId) return;
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_BASE_URL}/summary-card/${encodeURIComponent(reportId)}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nema_summary_${reportId.slice(0, 8)}.png`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrescriptionDownload = async () => {
    if (!reportId) {
      console.error("No reportId available for prescription download");
      return;
    }

    try {
      // Use the result ID for the API call
      const { url, blob } = await downloadPrescription(reportId);
      
      // Detect file type from MIME type
      const fileExtension = getFileExtension(blob.type);
      const fileName = `prescription_${reportId}.${fileExtension}`;
      
      // Create download link
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = fileName;
      
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      console.log(`Prescription downloaded successfully: ${fileName} (${blob.type})`);
    } catch (error) {
      console.error('Error downloading prescription:', error);
      alert('Failed to download prescription: ' + (error as Error).message);
    }
  };

  const handlePrescriptionView = async () => {
    if (!reportId) {
      console.error("No reportId available for prescription view");
      return;
    }

    setPrescriptionLoading(true);
    setPrescriptionModalOpen(true);

    try {
      // Use the API endpoint for prescription download
      const { url, blob } = await downloadPrescription(reportId);
      
      // Detect file type from MIME type
      const fileExtension = getFileExtension(blob.type);
      const fileName = `prescription_${reportId}.${fileExtension}`;
      
      // Get text content for text files
      let textContent;
      if (blob.type.startsWith('text/')) {
        textContent = await blob.text();
      }
      
      setCurrentPrescription({ url, blob, fileName, textContent });
    } catch (error) {
      console.error('Error viewing prescription:', error);
      alert('Failed to view prescription: ' + (error as Error).message);
      setPrescriptionModalOpen(false);
    } finally {
      setPrescriptionLoading(false);
    }
  };

  const handleAiRecommendationView = () => {
    setAiRecommendationModalOpen(true);
  };

  const handleAiRecommendationDownload = () => {
    const parsedSummary = parseAiSummary(patientInfo.ai_recommendation);
    
    // Create PDF document
    const doc = new jsPDF();
    
    // Set font sizes and colors
    doc.setFontSize(20);
    doc.setTextColor(0, 0, 0);
    
    // Add title
    doc.text('AI Recommendations', 20, 30);
    
    // Add patient info
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    const patientName = patientInfo.patient_info?.name || 'Patient';
    const currentDate = new Date().toLocaleDateString();
    doc.text(`Patient: ${patientName}`, 20, 45);
    doc.text(`Date: ${currentDate}`, 20, 55);
    
    // Add recommendations
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Recommendations:', 20, 75);
    
    doc.setFontSize(11);
    doc.setTextColor(60, 60, 60);
    
    let yPosition = 85;
    const lineHeight = 8;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    
    parsedSummary.forEach((recommendation, index) => {
      // Check if we need a new page
      if (yPosition > pageHeight - margin) {
        doc.addPage();
        yPosition = 30;
      }
      
      // Add recommendation with bullet point
      const text = `${index + 1}. ${recommendation}`;
      const lines = doc.splitTextToSize(text, 170);
      
      lines.forEach((line: string) => {
        if (yPosition > pageHeight - margin) {
          doc.addPage();
          yPosition = 30;
        }
        doc.text(line, 25, yPosition);
        yPosition += lineHeight;
      });
      
      yPosition += 3; // Extra space between recommendations
    });
    
    // Add footer note
    if (yPosition > pageHeight - 40) {
      doc.addPage();
      yPosition = 30;
    }
    
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text('Note: These are suggestions based on AI analysis. Always consult qualified medical professionals for clinical decisions.', 20, yPosition);
    
    // Save the PDF
    doc.save(`ai_recommendations_${patientName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleScreenshotPdf = async () => {
    setDownloadError(null);

    // if (!reportRef.current) {
    //   console.error("Report ref not available");
    //   setDownloadError("Report content is not ready yet. Please wait a moment and try again.");
    //   return;
    // }

    // setScreenshotPdfLoading(true);

    // const reportElement = reportRef.current;
    // const originalWidth = reportElement.style.width;
    // const originalMaxWidth = reportElement.style.maxWidth;
    window.print()


    // try {
    //   // reportElement.style.width = "1180px";
    //   // reportElement.style.maxWidth = "1180px";
    //   // reportElement.style.margin = "0";
    //   //       reportElement.style.padding = "0";

    //   reportElement.style.transform = "translateY(0)";
    //   await new Promise((resolve) => requestAnimationFrame(resolve));

    //   // Capture the report content as a canvas
    //   const canvas = await html2canvas(reportElement, {
    //     scale: 2, // Higher scale for better quality
    //     useCORS: true,
    //     // logging: false,
    //     backgroundColor: '#ffffff',
    //     // width: reportElement.scrollWidth,
    //     // height: reportElement.scrollHeight ,
    //     // windowWidth: 1280,
    //     // windowHeight: reportElement.scrollHeight,
    //     scrollX: 0,
    //     scrollY: 0,
    //   });

    //   const imgData = canvas.toDataURL('image/png');
      
    //   const pdf = new jsPDF('p', 'mm', 'a4');
    //   const pageWidth = pdf.internal.pageSize.getWidth();
    //   const pageHeight = pdf.internal.pageSize.getHeight();
    //   const pageMargin = 0;
    //   const maxWidth = pageWidth - pageMargin * 2;
    //   const maxHeight = pageHeight - pageMargin * 2;
    //   const imageRatio = canvas.width / canvas.height;
    //   const pageRatio = maxWidth / maxHeight;
    //   const imgWidth = imageRatio > pageRatio ? maxWidth : maxHeight * imageRatio;
    //   const imgHeight = imageRatio > pageRatio ? maxWidth / imageRatio : maxHeight;
    //   const x = (pageWidth - imgWidth) / 2;
    //   const y = (pageHeight - imgHeight) / 2;

    //   pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);

    //   // Save the PDF
    //   const patientName = patientInfo?.patient_info?.name || 'Patient';
    //   pdf.save(`patient_report_screenshot_${patientName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
    // } catch (error) {
    //   console.error('Error generating screenshot PDF:', error);
    //   alert('Failed to generate PDF screenshot. Please try again.');
    // } finally {
    //   reportElement.style.width = originalWidth;
    //   reportElement.style.maxWidth = originalMaxWidth;
    //   // reportElement.style.margin = originalMargin;
    //   // reportElement.style.transform = originalTransform;
    //   setScreenshotPdfLoading(false);
    // }
  };

  const markerItems = Array.isArray(cognitiveMarkers)
    ? cognitiveMarkers
    : cognitiveMarkers?.cards || [];
  const abnormalMarkerCount = markerItems.filter((m) => m.status === "abnormal").length;
  const flaggedCount = markerItems.filter((m: any) => m.status === "abnormal").length;
  const formatLabel = (s: string) => s ? s.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()) : "";
  const regions = patientInfo?.regions ?? {};
  const recordingContext = patientInfo?.recording_context ?? null;
  const regionOrder = ["posterior_occipital", "frontal", "temporal_memory", "global"];

 const parseAiSummary = (aiSummary: string | null | undefined): string[] => {
  if (!aiSummary) return [];

  try {
    // Case 1: Agar already array hai
    if (Array.isArray(aiSummary)) {
      return aiSummary;
    }

    // Case 2: JSON string hai (jaise tumhara example)
    let parsed = aiSummary.trim();

    // Agar string JSON array jaisa hai to parse karo
    if (parsed.startsWith("{") || parsed.startsWith("[")) {
      // Kuch strings mein outer {} hote hain, usko [] mein convert kar dete hain
      if (parsed.startsWith("{") && parsed.endsWith("}")) {
        parsed = "[" + parsed.slice(1, -1) + "]";
      }
      const result = JSON.parse(parsed);
      return Array.isArray(result) ? result : [aiSummary];
    }

    // Case 3: Normal string hai (fallback)
    return [aiSummary];

  } catch (error) {
    console.error("Error parsing AI Summary:", error);
    // Agar parse fail ho jaye toh pura text ek hi line mein dikhao
    return [aiSummary];
  }
};

  // Parse JSON-formatted medical observations
  const parseMedicalObservations = (observations: string) => {
    try {
      // Remove outer braces and split by comma
      const cleaned = observations.replace(/[{}]/g, '');
      const items = cleaned.split(',').map(item => {
        // Remove quotes and trim
        return item.replace(/"/g, '').trim();
      }).filter(item => item.length > 0);
      
      return items;
    } catch (error) {
      console.error('Error parsing medical observations:', error);
      return [observations];
    }
  };

  // Format AI recommendations from clinical interpretation text
  const formatAiRecommendations = (aiText: string | null | undefined): string[] => {
    if (!aiText) return [];

    try {
      const recommendations: string[] = [];
      
      // Extract clinical assessment findings
      if (aiText.includes('high risk for cognitive decline')) {
        recommendations.push('🔴 **High Risk Alert**: Patient shows elevated risk for cognitive decline based on EEG biomarkers');
      }
      
      // Extract signal quality concerns
      if (aiText.includes('Signal Quality Score')) {
        recommendations.push('📊 **Signal Quality**: Suboptimal recording conditions detected - consider repeat EEG if clinically indicated');
      }
      
      // Extract specific EEG findings
      if (aiText.includes('Posterior Dominance Index')) {
        recommendations.push('🧠 **EEG Finding**: Abnormal posterior-to-anterior dominance suggests disrupted cognitive networks');
      }
      
      if (aiText.includes('Alpha Peak Gradient')) {
        recommendations.push('⚡ **EEG Marker**: Elevated Alpha Peak Gradient indicates altered cortical function');
      }
      
      if (aiText.includes('Frontal Theta Beta Ratio')) {
        recommendations.push('📉 **EEG Marker**: Reduced Frontal Theta Beta Ratio may impact memory processes');
      }
      
      // Extract follow-up recommendations
      if (aiText.includes('neuropsychological assessment')) {
        recommendations.push('🔍 **Recommended**: Comprehensive neuropsychological assessment for detailed cognitive evaluation');
      }
      
      if (aiText.includes('MRI')) {
        recommendations.push('🖼️ **Imaging**: Consider MRI for structural and functional brain mapping correlations');
      }
      
      // Extract referral suggestions
      if (aiText.includes('memory specialist')) {
        recommendations.push('👥 **Referral**: Consider referral to memory specialist or Alzheimer\'s disease center');
      }
      
      // Extract lifestyle interventions
      if (aiText.includes('lifestyle interventions')) {
        recommendations.push('🏃‍♂️ **Lifestyle**: Implement cognitive health interventions - regular exercise, mental stimulation, social engagement');
      }
      
      if (aiText.includes('diet')) {
        recommendations.push('🥗 **Nutrition**: Balanced diet rich in omega-3 fatty acids recommended');
      }
      
      if (aiText.includes('sleep hygiene')) {
        recommendations.push('😴 **Sleep**: Good sleep hygiene practices essential for cognitive health');
      }
      
      // Extract limitations
      if (aiText.includes('limitations of EEG')) {
        recommendations.push('⚠️ **Limitation**: EEG screening has lower sensitivity for early dementia - comprehensive clinical workup required');
      }
      
      // If no specific patterns found, split by sentences and format
      if (recommendations.length === 0) {
        const sentences = aiText.split('.').filter(s => s.trim().length > 20);
        sentences.forEach((sentence, index) => {
          if (index < 5) { // Limit to top 5 recommendations
            recommendations.push(`• ${sentence.trim()}`);
          }
        });
      }
      
      return recommendations;
    } catch (error) {
      console.error('Error formatting AI recommendations:', error);
      return [aiText];
    }
  };

  const riskPercentage = patientInfo?.rf_risk?.percentage ?? patientInfo?.decline_summary?.percent ?? "N/A";
  const riskCategory = patientInfo?.rf_risk?.category ?? "N/A";
  const isAiRecommendationLoading = patientInfo?.ai_status && patientInfo.ai_status !== "success" && !patientInfo?.ai_summary && !fromPatientHistory;



  const renderFormattedAIText = (text: string) => {
  if (!text) return null;

  // Split into sentences (smart split)
  const sentences = text
    .replace(/\n/g, " ")
    .split(/(?<=\.)\s+(?=[A-Z])/);

  return (
    <div className="space-y-3 text-sm leading-relaxed">
      {sentences.map((sentence, index) => {
        const lower = sentence.toLowerCase();

        // Highlight important lines
        const isImportant =
          lower.includes("high risk") ||
          lower.includes("abnormal") ||
          lower.includes("significant");

        const isRecommendation =
          lower.includes("recommended") ||
          lower.includes("should") ||
          lower.includes("consider");

        return (
          <div
            key={index}
            className={`p-3 rounded-lg border ${
              isImportant
                ? "bg-red-50 border-red-200"
                : isRecommendation
                ? "bg-blue-50 border-blue-200"
                : "bg-muted/20 border-border"
            }`}
          >
            {sentence}
          </div>
        );
      })}
    </div>
  );
};
  if (error) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <p className="text-destructive text-lg font-medium">{error}</p>
          <button
            className="text-sm underline text-muted-foreground"
            onClick={() => window.history.back()}
          >
            Go back
          </button>
        </div>
      </MainLayout>
    );
  }

  // Show loader if data is loading
  if (isLoading || !patientInfo) {
    return (
      <MainLayout>
        <PageLoader text="Loading patient report..." />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Top action bar */}
        <div className="flex mb-5 flex-col gap-4 rounded-2xl border border-border/50 bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex w-fit rounded-xl bg-muted/70 p-1">
            {hasFeature("ai_summary") && (
              <button
                type="button"
                onClick={() => setActiveReportTab("summary")}
                disabled={!summaryResultId}
                className={cn(
                  "relative rounded-lg px-5 py-2.5 text-sm font-medium transition-all duration-200",
                  activeReportTab === "summary"
                    ? "bg-background text-foreground shadow-md"
                    : "text-muted-foreground hover:bg-background/60 hover:text-foreground",
                  !summaryResultId && "cursor-not-allowed opacity-50"
                )}
              >
                Findings & Summary
              </button>
            )}
            {hasFeature("risk_score") && (
              <button
                type="button"
                onClick={() => setActiveReportTab("analysis")}
                className={cn(
                  "relative rounded-lg px-5 py-2.5 text-sm font-medium transition-all duration-200",
                  activeReportTab === "analysis"
                    ? "bg-background text-foreground shadow-md"
                    : "text-muted-foreground hover:bg-background/60 hover:text-foreground"
                )}
              >
                Cognitive Analysis
              </button>
            )}
            {hasFeature("brain_age") && (
              <button
                type="button"
                onClick={() => setActiveReportTab("age_profile")}
                disabled={!summaryResultId}
                className={cn(
                  "relative rounded-lg px-5 py-2.5 text-sm font-medium transition-all duration-200",
                  activeReportTab === "age_profile"
                    ? "bg-background text-foreground shadow-md"
                    : "text-muted-foreground hover:bg-background/60 hover:text-foreground",
                  !summaryResultId && "cursor-not-allowed opacity-50"
                )}
              >
                Age Normative Context
              </button>
            )}
            {hasFeature("biomarkers") && (
              <button
                type="button"
                onClick={() => setActiveReportTab("brain_states")}
                className={cn(
                  "relative rounded-lg px-5 py-2.5 text-sm font-medium transition-all duration-200",
                  activeReportTab === "brain_states"
                    ? "bg-background text-foreground shadow-md"
                    : "text-muted-foreground hover:bg-background/60 hover:text-foreground"
                )}
              >
                Brain States
              </button>
            )}
            {hasFeature("biomarkers") && (
              <button
                type="button"
                onClick={() => setActiveReportTab("clinical_insights")}
                className={cn(
                  "relative rounded-lg px-5 py-2.5 text-sm font-medium transition-all duration-200",
                  activeReportTab === "clinical_insights"
                    ? "bg-background text-foreground shadow-md"
                    : "text-muted-foreground hover:bg-background/60 hover:text-foreground"
                )}
              >
                Insights & Activities
              </button>
            )}
            {hasFeature("treatment_plan") && (
              <button
                type="button"
                onClick={() => setActiveReportTab("personalised")}
                className={cn(
                  "relative rounded-lg px-5 py-2.5 text-sm font-medium transition-all duration-200",
                  activeReportTab === "personalised"
                    ? "bg-background text-foreground shadow-md"
                    : "text-muted-foreground hover:bg-background/60 hover:text-foreground"
                )}
              >
                My Plan
              </button>
            )}
          </div>
        </div>

        {activeReportTab === "age_profile" ? (
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
                        <YAxis domain={[0, 100]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} tickFormatter={(val) => `${val}%`} />
                        <Tooltip
                          formatter={(val, name, item: any) => {
                            if (name === "base") return null;
                            const pl = item.payload;
                            return [`${pl.base}–${pl.base + pl.range}%`, "Healthy norm"];
                          }}
                          labelFormatter={(val) => `Age group: ${val}`}
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
                          label={{ value: `${p.risk_percent}%`, position: "right", fill: "#dc2626", fontSize: 11, fontWeight: 600 }}
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
            <Button variant="outline" className="gap-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50" onClick={() => window.open(`/report/${reportId}/patient`, "_blank")}>
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
                  `Patient Report - ${patientInfo?.patient_info?.name || ''}`
                );
                const body = encodeURIComponent(
                  `Please find the patient report details below.\n\nReport ID: ${reportId || ''}\nPatient: ${patientInfo?.patient_info?.name || ''}\nAge/Gender: ${patientInfo?.patient_info?.age || ''} / ${patientInfo?.patient_info?.gender || ''}\n`
                );
                window.location.href = `mailto:?subject=${subject}&body=${body}`;
              }}
            >
              <Mail className="h-4 w-4" /> Send to Referring Doctor
            </Button>
          </div>
        {downloadError && (
          <p className="mt-2 text-sm text-destructive">{downloadError}</p>
        )}

        {/* Prescription Modal */}
        <Dialog open={prescriptionModalOpen} onOpenChange={setPrescriptionModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Prescription View</DialogTitle>
            </DialogHeader>
            {prescriptionLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-2">Loading prescription...</span>
              </div>
            ) : currentPrescription ? (
              <div className="space-y-4">
               
                {currentPrescription.blob.type.startsWith('text/') ? (
                  <div className="border rounded-lg p-4 bg-muted/20">
                    <pre className="whitespace-pre-wrap text-sm font-mono">
                      {currentPrescription.textContent}
                    </pre>
                  </div>
                ) : currentPrescription.blob.type.startsWith('image/') ? (
                  <div className="border rounded-lg p-4 bg-muted/20">
                    <img 
                      src={currentPrescription.url} 
                      alt="Prescription" 
                      className="max-w-full h-auto mx-auto"
                    />
                  </div>
                ) : (
                  <div className="border rounded-lg p-4 bg-muted/20">
                    <iframe
                      src={currentPrescription.url}
                      className="w-full h-[600px]"
                      title="Prescription"
                    />
                  </div>
                )}
              </div>
            ) : null}
          </DialogContent>
        </Dialog>

        {/* AI Recommendation Modal */}
        <Dialog open={aiRecommendationModalOpen} onOpenChange={setAiRecommendationModalOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                AI Recommendations Details
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
             
              {renderFormattedAIText(patientInfo.ai_recommendation)}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setAiRecommendationModalOpen(false)}>
                  Close
                </Button>
               
              </div>
            </div>
          </DialogContent>
        </Dialog>
        </Fragment>
        )}
      </div>
    </MainLayout>
  );
};

export default PatientReport;
