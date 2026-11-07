import React, { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import { API_BASE_URL } from "@/app/config";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

function formatDate() {
  return new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function getWellnessCards(cards: any[], regions: Record<string, any> = {}) {
  const regionCards = Object.values(regions).flatMap((r: any) => r.cards ?? []);
  const allCards = regionCards.length > 0 ? regionCards : cards;
  const abnormalCards = (allCards || [])
    .filter((c: any) => c.status === "abnormal")
    .flatMap((c: any) => getTipsForCard(c.label ?? "", c.id));

  const seen = new Set<string>();
  const unique = abnormalCards.filter((t) => {
    if (seen.has(t.title)) return false;
    seen.add(t.title);
    return true;
  });

  const defaults = [
    { title: "Stay Well-Hydrated", detail: "Even mild dehydration affects concentration and mood. Aim for 2 litres of water daily.", icon: "💧" },
    { title: "Regular Aerobic Exercise", detail: "30 minutes of moderate exercise most days is one of the best things you can do for brain health.", icon: "🏃" },
    { title: "Social Connection", detail: "Regular conversations and social activities protect long-term cognitive health.", icon: "🤝" },
  ];

  if (unique.length < 4) {
    defaults.forEach((d) => {
      if (!seen.has(d.title)) {
        unique.push(d);
        seen.add(d.title);
      }
    });
  }

  return unique.slice(0, 8);
}

function getTipsForCard(label: string, id?: string) {
  const r = (label + " " + (id ?? "")).toLowerCase();
  if (r.includes("pdr") || r.includes("posterior")) {
    return [
      { title: "Daily Outdoor Walk", detail: "A 30-minute walk in natural light helps maintain healthy brain rhythms.", icon: "🚶" },
      { title: "Reading & Puzzles", detail: "Regular reading and crossword puzzles challenge neural processing and support alpha wave stability.", icon: "🧩" },
    ];
  }
  if (r.includes("slow") || r.includes("theta") || r.includes("delta")) {
    return [
      { title: "Consistent Sleep Schedule", detail: "Going to bed and waking up at the same time supports natural slow-wave clearance during sleep.", icon: "🌙" },
      { title: "Morning Physical Movement", detail: "Physical activity before 6 PM promotes deeper, more restorative sleep.", icon: "🏃" },
    ];
  }
  if (r.includes("arousal") || r.includes("beta")) {
    return [
      { title: "Diaphragmatic Breathing", detail: "Place one hand on your belly. Breathe in for 4 counts, hold for 4, exhale for 6. Repeat 5 times.", icon: "💨" },
      { title: "Nature Time", detail: "Even 20 minutes in a park or garden measurably reduces the brain's stress response.", icon: "🌿" },
      { title: "Progressive Muscle Relaxation", detail: "Tense and release muscle groups from feet to face before sleeping — builds body awareness.", icon: "🛌" },
    ];
  }
  return [
    { title: "Daily Physical Activity", detail: "Even a 30-minute walk supports circulation and helps the brain stay healthy.", icon: "🚶" },
    { title: "Quality Sleep", detail: "Aim for 7–8 hours of consistent, uninterrupted sleep each night.", icon: "🌙" },
    { title: "Mindful Eating", detail: "A diet rich in vegetables, whole grains, and healthy fats supports long-term brain health.", icon: "🥗" },
  ];
}

function getStateDescription(label: string, level: string) {
  const r = label.toLowerCase();
  const n = level.toLowerCase();
  if (r.includes("focus") || r.includes("attention")) {
    return n === "high"
      ? "Your brain showed strong focus during the scan — a positive sign."
      : n === "moderate"
      ? "Your focus was at a comfortable, balanced level."
      : "Your focus was lower during this session. Activities below can help strengthen it.";
  }
  if (r.includes("relax") || r.includes("calm")) {
    return n === "high"
      ? "Your brain was in a calm, relaxed state — great for recovery."
      : n === "moderate"
      ? "Your relaxation levels were in a healthy range."
      : "Your brain was more active than resting. Stress-management activities may help.";
  }
  if (r.includes("stress") || r.includes("anxiety")) {
    return n === "low"
      ? "Stress signals were low during your scan — a healthy sign."
      : n === "moderate"
      ? "Moderate stress signals were detected. Relaxation routines can help."
      : "Your brain showed some stress activity. The wellness tips below can support you.";
  }
  if (r.includes("engag")) {
    return n === "high"
      ? "You were highly engaged and mentally active during the session."
      : "Your engagement was at a steady, comfortable level.";
  }
  if (r.includes("excit")) {
    return n === "high"
      ? "Your brain showed high energy and alertness."
      : "Your brain energy was at a balanced level.";
  }
  if (n === "high") return `Your ${label} score was strong during this session.`;
  if (n === "moderate") return `Your ${label} level was in a healthy, balanced range.`;
  return `Your ${label} level was lower this session. Small lifestyle adjustments can help.`;
}

export default function PatientFriendlyReport() {
  const { jobId } = useParams<{ jobId: string }>();
  const location = useLocation();
  const reportId = (location.state as any)?.reportId
    ? decodeURIComponent((location.state as any).reportId)
    : jobId
    ? decodeURIComponent(jobId)
    : undefined;

  const [report, setReport] = useState<any>(null);
  const [brainStates, setBrainStates] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!reportId) {
      setLoading(false);
      return;
    }
    const enc = encodeURIComponent(reportId);
    fetchWithAuth(`${API_BASE_URL}/report/${enc}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`Report not found (${res.status})`);
        return res.json();
      })
      .then((data) => setReport(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [reportId]);

  useEffect(() => {
    if (!reportId) return;
    const enc = encodeURIComponent(reportId);
    fetchWithAuth(`${API_BASE_URL}/v1/brain-states/${enc}`)
      .then(async (res) => {
        if (res.ok) setBrainStates(await res.json());
      })
      .catch(() => {});
  }, [reportId]);

  useEffect(() => {
    if (!loading && report) {
      const timer = setTimeout(() => window.print(), 600);
      return () => clearTimeout(timer);
    }
  }, [loading, report]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-500 text-sm">
        Preparing patient report…
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="flex items-center justify-center min-h-screen text-red-500 text-sm">
        {error || "Report data not available."}
      </div>
    );
  }

  const patientInfo = report?.patient_info ?? {};
  const name = patientInfo?.name || "Patient";
  const age = patientInfo?.age || "";
  const gender = patientInfo?.gender || patientInfo?.sex || "";
  const doctor =
    report?.technician_metadata?.doctor ||
    report?.rf_risk?.resident ||
    report?.resident ||
    "";
  const cards = Array.isArray(report?.cards) ? report.cards : [];
  const regions = report?.regions ?? {};
  const wellnessActivities = getWellnessCards(cards, regions);

  const hasStates = brainStates?.states && Object.keys(brainStates.states).length > 0;
  const stateOrder: string[] =
    brainStates?.state_order ?? (hasStates ? Object.keys(brainStates.states) : []);

  const journeySteps = [
    {
      weeks: "Weeks 1–2",
      label: "Getting Started",
      description:
        "Begin one new activity from your wellness tips — even 10 minutes a day counts. Focus on sleep consistency.",
    },
    {
      weeks: "Weeks 3–4",
      label: "Building Habits",
      description:
        "Add a second activity. Aim for 3–4 days per week. Notice how you feel — energy, mood, and clarity are good signals.",
    },
    {
      weeks: "Weeks 5–8",
      label: "Finding Your Rhythm",
      description:
        "Your new habits are becoming part of your routine. Start to notice which activities feel most helpful.",
    },
    {
      weeks: "Weeks 9–12",
      label: "Your Check-In",
      description:
        "A great time for a follow-up conversation with your doctor to see how things are progressing.",
    },
  ];

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          @page { margin: 18mm 16mm; }
        }
        body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1a1a2e; }
      `}</style>
      <div className="max-w-3xl mx-auto px-6 py-10 text-sm leading-relaxed">
        <div className="no-print mb-6 flex gap-3">
          <button
            onClick={() => window.print()}
            className="bg-emerald-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
          >
            🖨️ Print / Save as PDF
          </button>
        </div>

        {/* Header */}
        <div className="mb-8 border-b-2 border-emerald-500 pb-5">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-emerald-700">Brain Wellness Report</h1>
              <p className="text-xs text-gray-400 mt-0.5 uppercase tracking-wide">
                Prepared for personal use — not for clinical diagnosis
              </p>
            </div>
            <div className="text-right text-xs text-gray-500">
              <p className="font-semibold text-gray-700">{formatDate()}</p>
              {doctor && <p className="mt-0.5">Prepared by Dr. {doctor}</p>}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-4 rounded-xl bg-emerald-50 border border-emerald-100 px-5 py-4">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-emerald-600 font-semibold">Name</p>
              <p className="font-semibold text-gray-800 mt-0.5">{name}</p>
            </div>
            {age && (
              <div>
                <p className="text-[10px] uppercase tracking-widest text-emerald-600 font-semibold">Age</p>
                <p className="font-semibold text-gray-800 mt-0.5">{age}</p>
              </div>
            )}
            {gender && (
              <div>
                <p className="text-[10px] uppercase tracking-widest text-emerald-600 font-semibold">Gender</p>
                <p className="font-semibold text-gray-800 mt-0.5">{gender}</p>
              </div>
            )}
          </div>
        </div>

        {/* Section 1: About */}
        <section className="mb-8">
          <h2 className="text-base font-bold text-gray-800 mb-2">About Your EEG Scan</h2>
          <p className="text-gray-600 leading-relaxed">
            An electroencephalogram (EEG) is a simple, painless scan that records electrical signals produced by your brain. It helps your doctor understand your brain's activity patterns — things like focus, relaxation, and sleep rhythms. This wellness summary highlights what your scan showed and suggests everyday activities to support a healthier brain.
          </p>
        </section>

        {/* Section 2: Brain Activity States */}
        {hasStates && (
          <section className="mb-8">
            <h2 className="text-base font-bold text-gray-800 mb-3">Your Brain Activity During the Scan</h2>
            <div className="grid grid-cols-2 gap-3">
              {stateOrder.map((key) => {
                const s = brainStates.states[key];
                if (!s) return null;
                return (
                  <div
                    key={key}
                    className="rounded-xl border px-4 py-3"
                    style={{
                      borderColor: `${s.color || "#10b981"}40`,
                      backgroundColor: `${s.color || "#10b981"}08`,
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: s.color || "#10b981" }}
                      />
                      <p className="font-semibold text-gray-800 text-xs">{s.label || key}</p>
                      <span
                        className="ml-auto text-[10px] font-semibold uppercase rounded-full px-2 py-0.5"
                        style={{
                          backgroundColor: `${s.color || "#10b981"}20`,
                          color: s.color || "#10b981",
                        }}
                      >
                        {s.level || "Normal"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      {getStateDescription(s.label || key, s.level || "")}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Section 3: Personalised Activities */}
        <section className="mb-8">
          <h2 className="text-base font-bold text-gray-800 mb-1">Your Personalised Wellness Activities</h2>
          <p className="text-xs text-gray-400 mb-3">
            These suggestions are based on your scan results and are tailored to support your brain health.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {wellnessActivities.map((act, idx) => (
              <div key={idx} className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base">{act.icon}</span>
                  <p className="font-semibold text-gray-800 text-xs">{act.title}</p>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">{act.detail}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Section 4: 12-Week Journey */}
        <section className="mb-8">
          <h2 className="text-base font-bold text-gray-800 mb-3">Your 12-Week Wellness Journey</h2>
          <div className="space-y-3">
            {journeySteps.map((step, idx) => (
              <div key={idx} className="flex gap-4 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                <div className="flex-shrink-0 text-center">
                  <div className="h-7 w-7 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs">
                    {idx + 1}
                  </div>
                </div>
                <div>
                  <div className="flex items-baseline gap-2 mb-0.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600">
                      {step.weeks}
                    </p>
                    <p className="font-semibold text-gray-800 text-xs">{step.label}</p>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 5: Reminders */}
        <section className="mb-8">
          <h2 className="text-base font-bold text-gray-800 mb-2">Everyday Brain Health Reminders</h2>
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-5 py-4 grid grid-cols-2 gap-x-6 gap-y-2">
            {[
              ["💧", "Drink 2–3 litres of water daily"],
              ["🥦", "Eat more vegetables, fish, and nuts"],
              ["🏃", "30 minutes of movement every day"],
              ["🌙", "7–8 hours of sleep each night"],
              ["🤝", "Stay socially connected"],
              ["📖", "Keep your mind active — read, learn, play"],
            ].map(([emoji, text], idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs text-gray-700">
                <span>{emoji}</span>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Disclaimer Footer */}
        <div className="mt-8 border-t border-gray-200 pt-5 text-xs text-gray-400 leading-relaxed">
          <p className="font-semibold text-gray-500 mb-1">Important Note</p>
          <p>
            This wellness summary has been prepared by your doctor to help guide your everyday brain health. It is{" "}
            <strong>not</strong> a clinical diagnosis and should not replace your doctor's advice. If you have any questions about your scan results or notice any new or concerning symptoms, please speak with your doctor.
          </p>
          {doctor && (
            <p className="mt-2">
              Prepared by: <strong>Dr. {doctor}</strong>
              {reportId ? ` · Report reference: ${reportId}` : ""}
            </p>
          )}
        </div>
      </div>
    </>
  );
}
