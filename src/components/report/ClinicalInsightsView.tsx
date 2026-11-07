import React, { Fragment } from "react";
import { cn } from "@/lib/utils";
import { AlertCircle, Info } from "lucide-react";

interface ClinicalInsightsViewProps {
  markerItems: any[];
  regionData: Record<string, any>;
  riskCategory: string;
  riskPercentage: number | string;
}

const RISK_TAG_STYLES: Record<string, string> = {
  neurodegeneration: "bg-orange-50 text-orange-700 border-orange-200",
  psychiatric: "bg-purple-50 text-purple-700 border-purple-200",
  vascular: "bg-red-50 text-red-700 border-red-200",
  sleep: "bg-blue-50 text-blue-700 border-blue-200",
  focal: "bg-amber-50 text-amber-700 border-amber-200",
};

const ACTIVITY_CATEGORY_STYLES: Record<string, string> = {
  Physical: "bg-green-50 text-green-700",
  Cognitive: "bg-indigo-50 text-indigo-700",
  Lifestyle: "bg-sky-50 text-sky-700",
  Clinical: "bg-rose-50 text-rose-700",
};

function getMarkerInsight(label: string, id?: string) {
  const r = (label + " " + (id ?? "")).toLowerCase();
  if (r.includes("pdr") || r.includes("posterior dominant") || r.includes("dominant rhythm")) {
    return {
      risks: [
        { label: "Early Cognitive Decline", type: "neurodegeneration" },
        { label: "Mild Cognitive Impairment (MCI)", type: "neurodegeneration" },
        { label: "Metabolic Encephalopathy", type: "neurodegeneration" },
        { label: "Subcortical Ischemia", type: "vascular" },
      ],
      activities: [
        { title: "Daily Aerobic Exercise", detail: "30+ min brisk walking or cycling 5×/week. Aerobic activity is the strongest modifiable driver of PDR normalisation.", category: "Physical" },
        { title: "Cognitive Engagement", detail: "Reading, crossword puzzles, or learning a new language for ≥20 min/day to maintain posterior cortical activity.", category: "Cognitive" },
        { title: "Sleep Optimisation", detail: "Target 7–9 hrs consistent sleep. PDR normalises with improved sleep architecture.", category: "Lifestyle" },
        { title: "Neurological Follow-up", detail: "Correlate with neuropsychological testing and MRI to rule out structural cause of PDR slowing.", category: "Clinical" },
      ],
    };
  }
  if (r.includes("cognitive decline index") || r.includes("slow") || r.includes("fast wave") || r.includes("cdi")) {
    return {
      risks: [
        { label: "Alzheimer's Disease (early)", type: "neurodegeneration" },
        { label: "Vascular Cognitive Impairment", type: "vascular" },
        { label: "Lewy Body Dementia (early)", type: "neurodegeneration" },
      ],
      activities: [
        { title: "Aerobic + Resistance Training", detail: "Combination of cardio and strength training 4×/week reduces slow-wave burden by improving cerebral perfusion.", category: "Physical" },
        { title: "Dual-Task Cognitive Training", detail: "Perform cognitive tasks (counting backwards, word games) while walking — challenges both motor and cognitive networks.", category: "Cognitive" },
        { title: "Mediterranean Diet", detail: "High omega-3, antioxidant, and low-glycaemic diet reduces neuroinflammation associated with slow-wave progression.", category: "Lifestyle" },
        { title: "Repeat EEG in 1–3 Months", detail: "Establish a trend baseline early. Single-point readings carry uncertainty.", category: "Clinical" },
      ],
    };
  }
  if ((r.includes("theta") && r.includes("alpha")) || r.includes("memory-related") || r.includes("memory related")) {
    return {
      risks: [
        { label: "Hippocampal Dysfunction", type: "neurodegeneration" },
        { label: "Amnestic MCI", type: "neurodegeneration" },
        { label: "Depression-related Cognitive Impairment", type: "psychiatric" },
      ],
      activities: [
        { title: "Spaced-Repetition Memory Training", detail: "Apps like Anki or structured recall drills 15 min/day strengthen hippocampal encoding.", category: "Cognitive" },
        { title: "Mindfulness Meditation", detail: "Daily 10–20 min mindfulness practice normalises theta/alpha balance and reduces rumination.", category: "Lifestyle" },
        { title: "Omega-3 Supplementation", detail: "DHA 1–2 g/day supports hippocampal membrane integrity (with physician clearance).", category: "Lifestyle" },
        { title: "Sleep Stage Assessment", detail: "Abnormal theta/alpha often reflects disrupted slow-wave sleep. PSG or actigraphy is recommended.", category: "Clinical" },
        { title: "Social Engagement", detail: "Regular conversation-based activities (group classes, volunteering) are strongly memory-protective.", category: "Cognitive" },
      ],
    };
  }
  if ((r.includes("theta") && r.includes("beta")) || r.includes("executive") || r.includes("frontal theta")) {
    return {
      risks: [
        { label: "Attention Deficit Disorder (ADD/ADHD)", type: "psychiatric" },
        { label: "Frontal Lobe Dysfunction", type: "neurodegeneration" },
        { label: "Anxiety Disorder", type: "psychiatric" },
        { label: "Chronic Stress / Burnout", type: "psychiatric" },
      ],
      activities: [
        { title: "Mindfulness-Based Stress Reduction (MBSR)", detail: "8-week MBSR programme reduces frontal theta/beta ratio by lowering default-mode network overactivity.", category: "Cognitive" },
        { title: "Structured Task Planning", detail: "Time-blocking and priority lists reduce executive load and improve frontal regulation over weeks.", category: "Cognitive" },
        { title: "Reduce Screen Time Before Bed", detail: "Blue light suppresses prefrontal recovery during sleep. Limit screens ≥1 hr before sleep.", category: "Lifestyle" },
        { title: "High-Intensity Interval Training (HIIT)", detail: "3×/week HIIT sessions acutely reduce frontal theta and improve executive network efficiency.", category: "Physical" },
        { title: "Neuropsychological Evaluation", detail: "Recommend standardised executive function battery (BRIEF-A, D-KEFS) to quantify deficit profile.", category: "Clinical" },
      ],
    };
  }
  if (r.includes("gamma")) {
    return {
      risks: [
        { label: "Cortical Hyperexcitability", type: "focal" },
        { label: "Schizophrenia Spectrum (early marker)", type: "psychiatric" },
        { label: "Cognitive Processing Disorder", type: "neurodegeneration" },
      ],
      activities: [
        { title: "Creative & Artistic Activities", detail: "Music, visual art, and creative writing stimulate gamma synchrony and promote neuroplasticity.", category: "Cognitive" },
        { title: "Social Interaction", detail: "High-level conversation and social engagement drive frontal gamma coherence.", category: "Lifestyle" },
        { title: "Avoid Stimulants", detail: "Caffeine and high-sugar intake can exacerbate cortical hyperexcitability. Gradual reduction is advised.", category: "Lifestyle" },
        { title: "Psychiatric Liaison if Abnormal", detail: "Dysrhythmic gamma, particularly if bilateral, warrants psychiatric or epilepsy consultation.", category: "Clinical" },
      ],
    };
  }
  if (r.includes("asymmetr") || r.includes("hemispher") || r.includes("left-right") || r.includes("interhemispheric")) {
    return {
      risks: [
        { label: "Focal Cortical Lesion", type: "focal" },
        { label: "Stroke Risk / History", type: "vascular" },
        { label: "Epileptogenic Focus", type: "focal" },
        { label: "Unilateral Cerebrovascular Disease", type: "vascular" },
      ],
      activities: [
        { title: "Bilateral Coordination Exercises", detail: "Juggling, piano, or cross-body movement patterns improve interhemispheric communication via corpus callosum.", category: "Physical" },
        { title: "Neurofeedback Training", detail: "EEG neurofeedback targeting hemispheric symmetry has Level B evidence for asymmetry reduction.", category: "Clinical" },
        { title: "MRI Brain with DWI", detail: "Persistent asymmetry warrants structural MRI and diffusion-weighted imaging to exclude vascular or mass lesion.", category: "Clinical" },
        { title: "Cardiovascular Risk Reduction", detail: "Control BP, lipids, blood glucose — cerebrovascular risk is the most common reversible cause of EEG asymmetry.", category: "Lifestyle" },
      ],
    };
  }
  if (r.includes("sleep")) {
    return {
      risks: [
        { label: "Increased Dementia Risk (long-term)", type: "neurodegeneration" },
        { label: "REM Sleep Behaviour Disorder (Parkinson's precursor)", type: "neurodegeneration" },
        { label: "Major Depression", type: "psychiatric" },
        { label: "Metabolic Syndrome", type: "vascular" },
      ],
      activities: [
        { title: "Sleep Hygiene Protocol", detail: "Fixed wake time, dark/cool room, no caffeine after 2 PM, no screens 1 hr before bed.", category: "Lifestyle" },
        { title: "CBT for Insomnia (CBT-I)", detail: "Gold-standard non-pharmacological treatment. More effective than sleep medication long-term.", category: "Clinical" },
        { title: "Morning Sunlight Exposure", detail: "10–15 min outdoor sunlight within 1 hr of waking resets circadian rhythm and improves sleep depth.", category: "Lifestyle" },
        { title: "Polysomnography Referral", detail: "If sleep dysregulation is marked, sleep study to rule out sleep apnoea (a major modifiable dementia risk).", category: "Clinical" },
        { title: "Evening Aerobic Exercise (Early)", detail: "Exercise >3 hrs before bed improves slow-wave sleep. Avoid intense exercise within 2 hrs of bedtime.", category: "Physical" },
      ],
    };
  }
  if (r.includes("arousal")) {
    return {
      risks: [
        { label: "Anxiety Disorders", type: "psychiatric" },
        { label: "Chronic Fatigue Syndrome", type: "psychiatric" },
        { label: "Autonomic Nervous System Dysregulation", type: "focal" },
      ],
      activities: [
        { title: "Diaphragmatic Breathing", detail: "4-7-8 or box breathing 3× daily activates parasympathetic tone and stabilises arousal baseline.", category: "Lifestyle" },
        { title: "Progressive Muscle Relaxation", detail: "Daily 15-min PMR reduces physiological hyper-arousal markers including EEG arousal instability.", category: "Lifestyle" },
        { title: "Regular Moderate Exercise", detail: "Daily walking — avoids the over-stimulation of HIIT while building autonomic resilience.", category: "Physical" },
        { title: "HRV Monitoring", detail: "Wearable HRV tracking (e.g. Oura, Garmin) correlates well with EEG arousal and helps guide lifestyle pacing.", category: "Clinical" },
      ],
    };
  }
  return null;
}

function getAllCards(markerItems: any[], regionData: Record<string, any>) {
  const cards = Object.values(regionData).flatMap((r: any) => r.cards ?? []);
  return cards.length > 0 ? cards : markerItems;
}

export const ClinicalInsightsView: React.FC<ClinicalInsightsViewProps> = ({
  markerItems,
  regionData,
}) => {
  const allCards = getAllCards(markerItems, regionData);
  const abnormalMarkers = allCards.filter((m: any) => m.status === "abnormal");
  const insights = abnormalMarkers
    .map((m: any) => ({ marker: m, insight: getMarkerInsight(m.label ?? "", m.id) }))
    .filter((item): item is { marker: any; insight: NonNullable<ReturnType<typeof getMarkerInsight>> } => item.insight !== null);

  const allActivities = insights
    .flatMap((item) => item.insight.activities)
    .filter((act, idx, arr) => arr.findIndex((a) => a.title === act.title) === idx);

  const categories = ["Physical", "Cognitive", "Lifestyle", "Clinical"]
    .map((cat) => ({ category: cat, items: allActivities.filter((a) => a.category === cat) }))
    .filter((g) => g.items.length > 0);

  const universalRecommendations = [
    { title: "Hydration", detail: "Dehydration of even 2% reduces EEG amplitude and cognitive performance. Target 2–3 L water/day.", category: "Lifestyle" },
    { title: "B-vitamin Panel", detail: "B12, folate, and B6 deficiency directly impairs EEG biomarkers. Annual blood panel recommended.", category: "Clinical" },
    { title: "Alcohol Minimisation", detail: "Even moderate regular alcohol disrupts sleep architecture and slow-wave activity.", category: "Lifestyle" },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      {insights.length > 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-6 py-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-900">
                {abnormalMarkers.length} flagged biomarker{abnormalMarkers.length !== 1 ? "s" : ""} with associated neuro-risk signals
              </p>
              <p className="mt-0.5 text-xs text-amber-800 leading-relaxed">
                The patterns below are correlational, not diagnostic. They indicate which conditions are statistically associated with these EEG findings. A specialist should confirm any clinical hypothesis.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-green-200 bg-green-50 px-6 py-4 flex items-center gap-3">
          <Info className="h-5 w-5 text-green-700 shrink-0" />
          <p className="text-sm text-green-800">No abnormal biomarkers were flagged. General brain health recommendations are shown below.</p>
        </div>
      )}

      {/* Flagged Markers List */}
      {insights.map(({ marker, insight }) => (
        <div key={marker.id ?? marker.label} className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border bg-muted/30 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-0.5">Flagged Biomarker</p>
              <h3 className="text-base font-semibold text-foreground">{marker.label}</h3>
              {marker.value && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Value: <span className="font-medium text-red-700">{marker.value}</span>
                  {marker.normal_range && (
                    <Fragment> · Reference: {marker.normal_range}</Fragment>
                  )}
                </p>
              )}
            </div>
            <span className="shrink-0 mt-1 inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-700">
              <span className="h-1.5 w-1.5 rounded-full bg-red-600" />
              Abnormal
            </span>
          </div>

          <div className="px-6 py-5 space-y-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Associated Neurological Risk Signals</p>
              <div className="flex flex-wrap gap-2">
                {insight.risks.map((risk) => (
                  <span
                    key={risk.label}
                    className={cn("rounded-full border px-3 py-1 text-xs font-medium", RISK_TAG_STYLES[risk.type])}
                  >
                    {risk.label}
                  </span>
                ))}
              </div>
              {marker.interpretation && (
                <p className="mt-3 text-xs text-muted-foreground leading-relaxed border-l-2 border-border pl-3">
                  {marker.interpretation}
                </p>
              )}
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Recommended Activities</p>
              <div className="space-y-2">
                {insight.activities.map((act) => (
                  <div key={act.title} className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/20 px-4 py-3">
                    <span className={cn("shrink-0 mt-0.5 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide", ACTIVITY_CATEGORY_STYLES[act.category])}>
                      {act.category}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-foreground">{act.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{act.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Consolidated Personalised Plan */}
      {categories.length > 0 && (
        <div className="rounded-xl border border-border bg-card shadow-sm px-6 py-5">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Consolidated Personalised Plan</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {categories.map((group) => (
              <div key={group.category} className="rounded-lg border border-border/60 p-4">
                <p className={cn("inline-block rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide mb-3", ACTIVITY_CATEGORY_STYLES[group.category])}>
                  {group.category}
                </p>
                <ul className="space-y-1.5">
                  {group.items.map((item) => (
                    <li key={item.title} className="flex items-start gap-2 text-xs text-foreground">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-muted-foreground/60 shrink-0" />
                      <span className="font-medium">{item.title}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Universal Brain Health Recommendations */}
      <div className="rounded-xl border border-border bg-card shadow-sm px-6 py-5">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Universal Brain Health Recommendations</p>
        <div className="space-y-2">
          {universalRecommendations.map((item) => (
            <div key={item.title} className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/20 px-4 py-3">
              <span className={cn("shrink-0 mt-0.5 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide", ACTIVITY_CATEGORY_STYLES[item.category])}>
                {item.category}
              </span>
              <div>
                <p className="text-sm font-medium text-foreground">{item.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Clinical Note */}
      <div className="rounded-xl border border-border/50 bg-muted/20 px-6 py-4">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Clinical Note</p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Activity recommendations are derived from published neuroscience literature and are intended as supportive guidance for clinicians and patients. They are not a treatment plan and do not replace individualised medical advice. Neuro-risk associations are based on epidemiological correlations; the presence of an abnormal biomarker does not confirm any listed condition.
        </p>
      </div>
    </div>
  );
};
