import React from "react";
import { cn } from "@/lib/utils";
import { Target, Activity, Crosshair, Zap, AlertTriangle, Moon, BarChart3 } from "lucide-react";

interface BrainStatesViewProps {
  loading: boolean;
  error: string | null;
  data: any;
}

const STATE_ICONS: Record<string, React.ReactNode> = {
  target: <Target className="h-5 w-5" />,
  activity: <Activity className="h-5 w-5" />,
  crosshair: <Crosshair className="h-5 w-5" />,
  zap: <Zap className="h-5 w-5" />,
  "alert-triangle": <AlertTriangle className="h-5 w-5" />,
  moon: <Moon className="h-5 w-5" />,
};

const LEVEL_STYLES: Record<string, string> = {
  low: "bg-blue-50 text-blue-700 border-blue-200",
  moderate: "bg-amber-50 text-amber-700 border-amber-200",
  high: "bg-red-50 text-red-700 border-red-200",
};

export const BrainStatesView: React.FC<BrainStatesViewProps> = ({ loading, error, data }) => {
  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-12 text-center shadow-sm">
        <div className="flex items-center justify-center py-6 text-muted-foreground gap-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          <span className="text-sm font-medium">Loading brain state data…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-5 py-4 text-sm text-destructive">
        {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-xl border border-border bg-card p-12 text-center shadow-sm">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mx-auto mb-3">
          <BarChart3 className="h-6 w-6 text-muted-foreground opacity-60" />
        </div>
        <h3 className="font-semibold text-foreground text-sm sm:text-base">No Brain State Data Available</h3>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-sm mx-auto leading-relaxed">
          Brain state dynamics were not computed for this screening session, or this recording does not contain spectral brain state features.
        </p>
      </div>
    );
  }

  const { overview, states, state_order, summary_paragraph, meta } = data;
  const order = state_order ?? Object.keys(states ?? {});
  const durationMin = meta?.recording_seconds ? (meta.recording_seconds / 60).toFixed(1) : null;

  return (
    <div className="space-y-5">
      {/* Session Overview Card */}
      <div className="rounded-xl border border-border bg-card px-7 py-5 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Session Overview</p>
        <h2 className="text-base font-semibold text-foreground">{overview?.headline}</h2>
        {summary_paragraph && (
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{summary_paragraph}</p>
        )}
        <div className="mt-4 flex flex-wrap gap-5 border-t border-border pt-4 text-xs text-muted-foreground">
          {meta?.filename && (
            <span>
              <span className="font-semibold text-foreground">File:</span> {meta.filename}
            </span>
          )}
          {durationMin && (
            <span>
              <span className="font-semibold text-foreground">Duration:</span> {durationMin} min
            </span>
          )}
          {meta?.n_epochs && (
            <span>
              <span className="font-semibold text-foreground">Epochs:</span> {meta.n_epochs.toLocaleString()}
            </span>
          )}
          {meta?.sfreq && (
            <span>
              <span className="font-semibold text-foreground">Sample rate:</span> {meta.sfreq} Hz
            </span>
          )}
          {meta?.n_channels && (
            <span>
              <span className="font-semibold text-foreground">Channels:</span> {meta.n_channels}
            </span>
          )}
          {overview?.dominant_label && (
            <span className="ml-auto font-semibold text-primary">
              Dominant: {overview.dominant_label} ({((overview.dominant_score ?? 0) * 100).toFixed(1)}%)
            </span>
          )}
        </div>
      </div>

      {/* Grid of Brain States */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {order.map((key: string) => {
          const state = states?.[key];
          if (!state) return null;

          const isDominant = key === overview?.dominant_state;
          const isLowest = key === overview?.lowest_state;
          const pct = state.percent ?? (state.score != null ? +(state.score * 100).toFixed(1) : null);

          return (
            <div
              key={key}
              className={cn(
                "rounded-xl border bg-card px-5 py-4 shadow-sm transition-all",
                isDominant ? "border-primary/40 ring-1 ring-primary/20" : "border-border"
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-full"
                    style={{ backgroundColor: `${state.color}20`, color: state.color }}
                  >
                    {STATE_ICONS[state.icon] ?? <Activity className="h-5 w-5" />}
                  </span>
                  <span className="font-semibold text-sm text-foreground">{state.label}</span>
                </div>
                {isDominant && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                    Dominant
                  </span>
                )}
                {isLowest && !isDominant && (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    Lowest
                  </span>
                )}
              </div>

              <div className="mb-3">
                <div className="flex items-end justify-between mb-1">
                  <span className="text-3xl font-bold tabular-nums" style={{ color: state.color }}>
                    {pct != null ? `${pct.toFixed(1)}%` : "—"}
                  </span>
                  <span
                    className={cn(
                      "mb-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                      LEVEL_STYLES[state.level] ?? "bg-muted text-muted-foreground border-border"
                    )}
                  >
                    {state.level}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct ?? 0}%`, backgroundColor: state.color }}
                  />
                </div>
              </div>

              <p className="text-xs font-medium text-foreground mb-1">{state.level_text}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{state.description}</p>

              {state.stats && (
                <div className="mt-3 grid grid-cols-4 gap-1 border-t border-border pt-3 text-center">
                  {[
                    { label: "Mean", val: state.stats.mean },
                    { label: "Std", val: state.stats.std },
                    { label: "Min", val: state.stats.min },
                    { label: "Max", val: state.stats.max },
                  ].map(({ label, val }) => (
                    <div key={label}>
                      <p className="text-[9px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
                      <p className="text-[11px] font-semibold text-foreground">{(val * 100).toFixed(0)}%</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Disclaimer */}
      <div className="rounded-xl border border-border/50 bg-muted/20 px-6 py-4">
        <p className="text-xs text-muted-foreground leading-relaxed">
          Brain state scores are derived from EEG band-power ratios, a standard neurofeedback technique. Results are intended as supportive indicators for clinicians and are not a standalone diagnosis.
        </p>
      </div>
    </div>
  );
};
