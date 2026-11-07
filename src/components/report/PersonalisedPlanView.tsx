import React from "react";
import { cn } from "@/lib/utils";
import { Info } from "lucide-react";

interface PersonalisedPlanViewProps {
  patientInfo: any;
  markerItems: any[];
  regionData: Record<string, any>;
  riskCategory: string;
  riskPercentage: number | string;
}

const URGENCY_STYLES: Record<string, string> = {
  "This week": "bg-primary/10 text-primary border-primary/20",
  "This month": "bg-muted text-muted-foreground border-border",
  Ongoing: "bg-muted text-muted-foreground border-border",
};

export const PersonalisedPlanView: React.FC<PersonalisedPlanViewProps> = ({
  patientInfo,
  markerItems,
  regionData,
  riskCategory,
}) => {
  const info = patientInfo?.patient_info ?? {};
  const name = info.name || "the patient";
  const age = typeof info.age === "number" ? info.age : parseInt(info.age) || 0;
  const gender = info.gender || "";
  const cat = (riskCategory ?? "").toLowerCase();

  const allCards = Object.values(regionData).flatMap((r: any) => r.cards ?? []);
  const abnormalList = (allCards.length > 0 ? allCards : markerItems).filter((m: any) => m.status === "abnormal");
  const abnormalCount = abnormalList.length;

  const planLevel =
    cat.includes("high") || abnormalCount >= 5
      ? "urgent"
      : cat.includes("elevated") || abnormalCount >= 3
      ? "elevated"
      : cat.includes("moderate") || abnormalCount >= 1
      ? "watchful"
      : "reassured";

  const config = {
    urgent: {
      label: "Clinical Follow-Up Recommended",
      color: "text-primary",
      bg: "bg-primary/5",
      border: "border-primary/20",
      msg: "Multiple findings outside reference range. A specialist review is recommended to correlate with clinical history.",
    },
    elevated: {
      label: "Structured Plan Advised",
      color: "text-primary",
      bg: "bg-primary/5",
      border: "border-primary/20",
      msg: "Several biomarkers are outside the expected range. A structured lifestyle plan and follow-up EEG in 3 months is recommended.",
    },
    watchful: {
      label: "Monitor & Optimise",
      color: "text-muted-foreground",
      bg: "bg-muted/30",
      border: "border-border",
      msg: "Some findings warrant attention. Targeted lifestyle changes and a follow-up EEG in 1–3 months are advisable.",
    },
    reassured: {
      label: "Within Expected Range",
      color: "text-muted-foreground",
      bg: "bg-muted/30",
      border: "border-border",
      msg: "EEG profile is within expected limits. Maintain healthy habits and schedule routine follow-up in 6–12 months.",
    },
  }[planLevel];

  const ageNote =
    age >= 70
      ? "At your age, even mild EEG changes can accelerate over months. Early action has the highest return."
      : age >= 55
      ? "The 55–70 window is critical — neuroplasticity is still strong but the trajectory is set now."
      : age >= 40
      ? "Midlife biomarker patterns are highly modifiable with the right interventions."
      : "Younger brains recover faster. Changes made now can normalise EEG patterns within weeks to months.";

  const actionPlan: Array<{ rank: number; title: string; why: string; how: string; urgency: string }> = [];

  if (planLevel === "urgent" || planLevel === "elevated") {
    actionPlan.push({
      rank: 1,
      title: "Specialist Correlation",
      why: `${abnormalCount} biomarker${abnormalCount !== 1 ? "s" : ""} outside reference range. Clinical correlation with a neurologist or geriatrician is recommended.`,
      how: "Share this report with the referring neurologist. Consider neuropsychological testing and structural imaging if not recently performed.",
      urgency: "This week",
    });
  }

  const hasSleepIssue = abnormalList.some((m: any) => (m.label ?? "").toLowerCase().includes("sleep"));
  if (hasSleepIssue || age >= 60) {
    actionPlan.push({
      rank: actionPlan.length + 1,
      title: "Sleep Quality Assessment",
      why: hasSleepIssue
        ? "Sleep Dysregulation Index is outside reference range. Sleep architecture improvement is among the most modifiable factors influencing EEG outcomes."
        : "Age-related changes in sleep architecture directly affect EEG biomarker profiles. Optimising sleep quality can meaningfully improve longitudinal readings.",
      how: "Recommend 2-week sleep diary. Target 7–9 hrs with consistent wake time. Consider home sleep study to rule out sleep apnoea if indicated.",
      urgency: "This week",
    });
  }

  actionPlan.push({
    rank: actionPlan.length + 1,
    title: "Aerobic Exercise Programme",
    why: `Regular aerobic exercise has Level A evidence for improving EEG biomarkers${abnormalList.length > 0 ? ` including ${abnormalList.slice(0, 2).map((m: any) => m.label).join(" and ")}` : ""}.`,
    how: age >= 65
      ? "20–30 min brisk walking daily, progressing to 40 min. Pool walking is effective if mobility is a concern."
      : "30–45 min moderate cardio (walking, cycling, swimming) 5 days/week at 60–70% max HR.",
    urgency: "This week",
  });

  if (abnormalList.some((m: any) => {
    const l = (m.label ?? "").toLowerCase();
    return l.includes("frontal") || l.includes("executive") || (l.includes("theta") && l.includes("beta"));
  })) {
    actionPlan.push({
      rank: actionPlan.length + 1,
      title: "Structured Cognitive Training",
      why: "Your frontal biomarkers suggest executive network strain. Targeted cognitive exercises directly engage these circuits.",
      how: "15 min daily: alternate between a working memory game (dual n-back), a planning task (chess puzzles or Sudoku), and a language task (learn 5 new words). Avoid passive screen time.",
      urgency: "This month",
    });
  }

  if (abnormalList.some((m: any) => (m.label ?? "").toLowerCase().includes("asymmetr"))) {
    actionPlan.push({
      rank: actionPlan.length + 1,
      title: "Cardiovascular Risk Check",
      why: "Interhemispheric asymmetry is frequently caused by cerebrovascular changes. Addressing vascular risk factors is the most direct path to EEG improvement.",
      how: "Request a blood panel: fasting glucose, HbA1c, lipid profile, BP measurement. If not done in the last 12 months, these are essential before the next EEG.",
      urgency: "This month",
    });
  }

  if (actionPlan.length < 3) {
    actionPlan.push({
      rank: actionPlan.length + 1,
      title: "Diet Optimisation",
      why: "Mediterranean-pattern eating — high in fish, olive oil, nuts, vegetables — reduces neuroinflammation and supports the biomarkers flagged in your report.",
      how: `Swap refined carbohydrates for whole grains, add fatty fish (salmon/sardines) 2×/week, and replace seed oils with olive oil. ${gender === "F" || gender === "Female" ? "Ensure adequate iron and vitamin D — both common deficiencies that worsen EEG baseline in women." : ""}`,
      urgency: "This month",
    });
  }

  const journey = [
    {
      week: "Week 1–2",
      label: "Foundation",
      actions: [
        "Begin aerobic routine (start at 20 min, build up)",
        "Track sleep for 2 weeks",
        "Book any clinical appointments identified above",
      ],
    },
    {
      week: "Week 3–4",
      label: "Build",
      actions: [
        "Add daily cognitive training (15 min)",
        "Introduce Mediterranean dietary changes",
        "First check-in: note any changes in energy or focus",
      ],
    },
    {
      week: "Week 5–8",
      label: "Intensify",
      actions: [
        "Reach full 30–45 min aerobic target",
        "Add mindfulness or breathing practice (10 min daily)",
        "Complete any referred investigations (blood panel, sleep study)",
      ],
    },
    {
      week: "Week 9–12",
      label: "Review",
      actions: [
        "Self-assess: is focus, sleep, or energy noticeably different?",
        "Prepare for follow-up EEG",
        "Share activity log with your physician at review appointment",
      ],
    },
  ];

  const questions = [
    `EEG findings for ${name || "this patient"} (age ${age}${gender ? `, ${gender}` : ""}): what is the recommended clinical follow-up interval based on the current profile?`,
    abnormalCount > 0
      ? `${abnormalCount} biomarker${abnormalCount !== 1 ? "s are" : " is"} outside reference range — including ${abnormalList.slice(0, 2).map((m: any) => m.label).join(" and ")}. Is structural imaging or neuropsychological testing indicated?`
      : "All biomarkers are within reference range. What monitoring schedule is recommended for routine follow-up?",
    hasSleepIssue || age >= 60
      ? "Is a home sleep study or polysomnography indicated to rule out sleep apnoea as a contributing factor?"
      : "Are current medications or supplements likely to influence EEG baseline readings?",
    "What specific symptom changes should prompt an earlier review before the scheduled follow-up?",
    "At what point would improvement in EEG markers indicate a meaningful positive response to the recommended lifestyle interventions?",
  ];

  const symptomsToReport = [
    "New or progressive memory difficulties beyond expected variation",
    "Episodic confusion, staring spells, or transient unresponsiveness",
    "Acute onset focal neurological deficit (speech, vision, motor) — triage immediately",
    "Notable personality or behavioural change reported by family or carers",
    "New recurrent headaches or visual symptoms not previously evaluated",
  ];

  return (
    <div className="space-y-6">
      {/* Clinical Plan Summary Card */}
      <div className={cn("rounded-xl border px-6 py-5 shadow-sm", config.bg, config.border)}>
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Clinical Plan Summary</p>
            <h2 className={cn("mt-1 text-base font-semibold", config.color)}>{config.label}</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground max-w-2xl">{config.msg}</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground border-t border-border/50 pt-3">
          {name && (
            <span>
              <span className="font-medium text-foreground">Patient:</span> {name}
            </span>
          )}
          {age > 0 && (
            <span>
              <span className="font-medium text-foreground">Age:</span> {age} yrs
            </span>
          )}
          {gender && (
            <span>
              <span className="font-medium text-foreground">Gender:</span> {gender}
            </span>
          )}
          {info.id && (
            <span>
              <span className="font-medium text-foreground">ID:</span> {info.id}
            </span>
          )}
          {abnormalCount > 0 && (
            <span>
              <span className="font-medium text-foreground">Findings:</span> {abnormalCount} outside reference range
            </span>
          )}
          <span className="ml-auto text-muted-foreground/70 italic">{ageNote}</span>
        </div>
      </div>

      {/* Priority Action Plan */}
      <div className="rounded-xl border border-border bg-card shadow-sm px-6 py-5">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Your Priority Action Plan</p>
        <div className="space-y-4">
          {actionPlan.map((item) => (
            <div key={item.rank} className="flex gap-4 rounded-xl border border-border/70 bg-muted/20 px-5 py-4">
              <div className="shrink-0">
                <span className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold bg-primary/10 text-primary">
                  {item.rank}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3 mb-1">
                  <p className="font-semibold text-sm text-foreground">{item.title}</p>
                  <span className={cn("shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide", URGENCY_STYLES[item.urgency])}>
                    {item.urgency}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed mb-2 border-l-2 border-primary/30 pl-3">
                  {item.why}
                </p>
                <p className="text-xs text-foreground leading-relaxed">
                  <span className="font-medium">How: </span>{item.how}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 12-Week Journey */}
      <div className="rounded-xl border border-border bg-card shadow-sm px-6 py-5">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Your 12-Week Journey</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {journey.map((item, idx) => (
            <div key={item.week} className="rounded-lg border border-border/60 p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-[11px] font-bold">
                  {idx + 1}
                </span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{item.week}</p>
                  <p className="text-xs font-semibold text-foreground">{item.label}</p>
                </div>
              </div>
              <ul className="space-y-1.5">
                {item.actions.map((act, aIdx) => (
                  <li key={aIdx} className="flex items-start gap-1.5 text-xs text-muted-foreground leading-relaxed">
                    <span className="mt-1.5 h-1 w-1 rounded-full bg-muted-foreground/50 shrink-0" />
                    {act}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Questions to Ask Your Doctor */}
      <div className="rounded-xl border border-border bg-card shadow-sm px-6 py-5">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Questions to Ask Your Doctor</p>
        <p className="text-xs text-muted-foreground mb-4">Based on your specific findings — bring this list to your next appointment.</p>
        <ol className="space-y-3">
          {questions.map((q, idx) => (
            <li key={idx} className="flex items-start gap-3 text-sm text-foreground leading-relaxed">
              <span className="shrink-0 mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-[11px] font-bold">
                {idx + 1}
              </span>
              {q}
            </li>
          ))}
        </ol>
      </div>

      {/* Symptoms to Report */}
      <div className="rounded-xl border border-border bg-muted/20 px-6 py-5">
        <div className="flex items-center gap-2 mb-3">
          <Info className="h-4 w-4 text-muted-foreground shrink-0" />
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Symptoms to Report at Next Appointment</p>
        </div>
        <ul className="space-y-2">
          {symptomsToReport.map((symptom, idx) => (
            <li key={idx} className="flex items-start gap-2 text-xs text-muted-foreground leading-relaxed">
              <span className="mt-1 h-1 w-1 rounded-full bg-muted-foreground/40 shrink-0" />
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
              {symptom}
            </li>
          ))}
        </ul>
      </div>

      {/* Algorithm Disclaimer */}
      <div className="rounded-xl border border-border/50 bg-muted/20 px-6 py-4">
        <p className="text-xs text-muted-foreground leading-relaxed">
          This personalised plan is generated algorithmically from your EEG biomarker data, risk score, and demographic information. It is designed to support — not replace — the advice of your treating clinician. All recommendations should be reviewed with your physician before implementation, particularly the clinical actions.
        </p>
      </div>
    </div>
  );
};
