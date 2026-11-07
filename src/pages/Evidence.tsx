import { MainLayout } from "@/components/layout/MainLayout";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Brain,
  Database,
  BarChart3,
  Users,
  AlertTriangle,
  Shield,
  CheckCircle2,
  FileText,
  Activity,
} from "lucide-react";

const Evidence = () => {
  return (
    <MainLayout>
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="text-center">
          <span className="inline-block px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-full bg-primary/10 text-primary mb-2">
            NEMA AI
          </span>
          <h1 className="text-2xl font-bold text-foreground">Model Evidence & Validation</h1>
          <p className="mt-2 text-muted-foreground max-w-xl mx-auto">
            Scientific foundation and clinical validation of the CognEEG engine — NEMA AI's core model for non-invasive cognitive and neurological EEG screening.
          </p>
        </div>

        {/* Trust Badges */}
        <div className="flex flex-wrap justify-center gap-3">
          <Badge variant="outline" className="px-4 py-2 text-sm">
            <CheckCircle2 className="mr-2 h-4 w-4 text-risk-low" />
            India-Validated Cohort
          </Badge>
          <Badge variant="outline" className="px-4 py-2 text-sm">
            <Shield className="mr-2 h-4 w-4 text-primary" />
            DPDP & HIPAA Aligned
          </Badge>
          <Badge variant="outline" className="px-4 py-2 text-sm">
            <FileText className="mr-2 h-4 w-4 text-risk-moderate" />
            CDSCO Registration (In Progress)
          </Badge>
          <Badge variant="outline" className="px-4 py-2 text-sm">
            <Activity className="mr-2 h-4 w-4 text-primary" />
            NIMHANS Report Format
          </Badge>
        </div>

        {/* Research Partner Card */}
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Brain className="h-7 w-7 text-primary" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-0.5">Research Partner</p>
            <h3 className="text-lg font-bold text-foreground">All India Institute of Medical Sciences (AIIMS), New Delhi</h3>
            <p className="text-sm text-muted-foreground mt-1">
              NEMA AI's model validation and clinical research is conducted in collaboration with AIIMS Delhi — India's foremost medical institution — ensuring the CognEEG engine meets the highest standards of clinical rigour for the Indian population.
            </p>
          </div>
        </div>

        {/* 3 Pillars Card */}
        <div className="rounded-xl border border-border bg-muted/30 p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="space-y-1">
            <div className="flex justify-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Brain className="h-5 w-5 text-primary" />
              </div>
            </div>
            <p className="font-semibold text-foreground text-sm">CognEEG Pipeline</p>
            <p className="text-xs text-muted-foreground">AI-driven cognitive risk scoring, brain age estimation, and dementia biomarker detection.</p>
          </div>
          <div className="space-y-1">
            <div className="flex justify-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
            </div>
            <p className="font-semibold text-foreground text-sm">Technician Report</p>
            <p className="text-xs text-muted-foreground">Structured NIMHANS-format EEG documentation with automated signal findings and PDF output.</p>
          </div>
          <div className="space-y-1">
            <div className="flex justify-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Activity className="h-5 w-5 text-primary" />
              </div>
            </div>
            <p className="font-semibold text-foreground text-sm">EEG Signal Analysis</p>
            <p className="text-xs text-muted-foreground">Deep waveform inspection — sleep staging, spectral markers, and channel-level quality grading.</p>
          </div>
        </div>

        {/* Main Content */}
        <Accordion type="single" collapsible className="space-y-4">
          {/* How the AI Works */}
          <AccordionItem value="how-it-works" className="clinical-card border-none">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Brain className="h-5 w-5 text-primary" />
                </div>
                <div className="text-left">
                  <h2 className="text-lg font-semibold text-foreground">How CognEEG Works</h2>
                  <p className="text-sm text-muted-foreground">NEMA AI's core analysis engine</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4 text-muted-foreground">
              <div className="space-y-4 pl-13">
                <p className="leading-relaxed">
                  Our AI analyzes EEG signals using advanced signal processing and machine learning 
                  techniques to identify biomarkers associated with cognitive decline and dementia.
                </p>
                <div className="space-y-3">
                  <h4 className="font-semibold text-foreground">Key Processing Steps:</h4>
                  <ol className="list-inside list-decimal space-y-2 text-sm">
                    <li>
                      <strong>Signal Preprocessing:</strong> Artifact removal, filtering, and channel 
                      quality assessment using ICA and adaptive filtering.
                    </li>
                    <li>
                      <strong>Feature Extraction:</strong> Computation of spectral power bands 
                      (delta, theta, alpha, beta, gamma), connectivity measures, and asymmetry indices.
                    </li>
                    <li>
                      <strong>Brain Age Estimation:</strong> Comparison of EEG patterns against 
                      age-matched normative databases to estimate functional brain age.
                    </li>
                    <li>
                      <strong>Risk Classification:</strong> Multi-layer neural network trained on 
                      labeled clinical data to predict dementia risk probability.
                    </li>
                    <li>
                      <strong>Interpretation Generation:</strong> Rule-based and ML-driven explanations 
                      of key contributing factors.
                    </li>
                  </ol>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Training Dataset */}
          <AccordionItem value="dataset" className="clinical-card border-none">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                  <Database className="h-5 w-5 text-primary" />
                </div>
                <div className="text-left">
                  <h2 className="text-lg font-semibold text-foreground">Training Dataset</h2>
                  <p className="text-sm text-muted-foreground">Data sources and population coverage</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4 text-muted-foreground">
              <div className="space-y-4 pl-13">
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <div className="rounded-lg bg-muted/50 p-4 text-center">
                    <p className="text-2xl font-bold text-foreground">12,450</p>
                    <p className="text-xs text-muted-foreground">Total EEG Recordings</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-4 text-center">
                    <p className="text-2xl font-bold text-foreground">8</p>
                    <p className="text-xs text-muted-foreground">Clinical Centers</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-4 text-center">
                    <p className="text-2xl font-bold text-foreground">45-92</p>
                    <p className="text-xs text-muted-foreground">Age Range (years)</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-4 text-center">
                    <p className="text-2xl font-bold text-foreground">52%/48%</p>
                    <p className="text-xs text-muted-foreground">Female/Male</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-foreground">Diagnostic Categories:</h4>
                  <ul className="list-inside list-disc space-y-1 text-sm">
                    <li>Healthy controls: 4,200 (34%)</li>
                    <li>Mild Cognitive Impairment (MCI): 3,850 (31%)</li>
                    <li>Early Alzheimer's Disease: 2,100 (17%)</li>
                    <li>Vascular Dementia: 1,400 (11%)</li>
                    <li>Other dementias: 900 (7%)</li>
                  </ul>
                </div>

                <p className="text-sm">
                  <strong>Indian Population Cohort:</strong> 3,200 recordings from 5 centers across 
                  India, ensuring model validity for the local population.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Validation Study */}
          <AccordionItem value="validation" className="clinical-card border-none">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-risk-low-bg">
                  <BarChart3 className="h-5 w-5 text-risk-low" />
                </div>
                <div className="text-left">
                  <h2 className="text-lg font-semibold text-foreground">Validation Study Results</h2>
                  <p className="text-sm text-muted-foreground">Performance metrics and confidence</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4 text-muted-foreground">
              <div className="space-y-4 pl-13">
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                  <div className="rounded-lg border border-risk-low/30 bg-risk-low-bg p-4 text-center">
                    <p className="text-3xl font-bold text-risk-low">87.3%</p>
                    <p className="text-sm text-muted-foreground">Sensitivity</p>
                    <p className="text-xs text-muted-foreground">(95% CI: 84.2-90.1%)</p>
                  </div>
                  <div className="rounded-lg border border-primary/30 bg-accent p-4 text-center">
                    <p className="text-3xl font-bold text-primary">82.6%</p>
                    <p className="text-sm text-muted-foreground">Specificity</p>
                    <p className="text-xs text-muted-foreground">(95% CI: 79.8-85.2%)</p>
                  </div>
                  <div className="rounded-lg border border-risk-moderate/30 bg-risk-moderate-bg p-4 text-center">
                    <p className="text-3xl font-bold text-risk-moderate">0.91</p>
                    <p className="text-sm text-muted-foreground">AUC-ROC</p>
                    <p className="text-xs text-muted-foreground">(95% CI: 0.88-0.93)</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-foreground">Validation Methodology:</h4>
                  <ul className="list-inside list-disc space-y-1 text-sm">
                    <li>Independent test set: 2,490 recordings (20% holdout)</li>
                    <li>5-fold cross-validation on training data</li>
                    <li>External validation at 2 independent centers</li>
                    <li>Gold standard: Clinical diagnosis + neuroimaging + cognitive testing</li>
                  </ul>
                </div>

                <p className="text-sm bg-muted/50 p-3 rounded-lg">
                  <strong>Note:</strong> Performance may vary based on EEG signal quality, 
                  patient demographics, and recording conditions. Results are intended 
                  to support, not replace, clinical judgment.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Population Suitability */}
          <AccordionItem value="population" className="clinical-card border-none">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div className="text-left">
                  <h2 className="text-lg font-semibold text-foreground">Population Suitability</h2>
                  <p className="text-sm text-muted-foreground">Intended use and patient criteria</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4 text-muted-foreground">
              <div className="space-y-4 pl-13">
                <div className="space-y-2">
                  <h4 className="font-semibold text-foreground">Intended Patient Population:</h4>
                  <ul className="list-inside list-disc space-y-1 text-sm">
                    <li>Adults aged 55 years and older</li>
                    <li>Patients with memory concerns or cognitive symptoms</li>
                    <li>Routine screening in high-risk populations</li>
                    <li>Follow-up monitoring of known MCI/dementia patients</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-foreground">Validated Demographics:</h4>
                  <ul className="list-inside list-disc space-y-1 text-sm">
                    <li>South Asian populations (India-specific validation)</li>
                    <li>Caucasian populations (European cohorts)</li>
                    <li>Age range: 55-90 years (best performance: 60-80 years)</li>
                  </ul>
                </div>

                <div className="rounded-lg border border-risk-moderate/30 bg-risk-moderate-bg p-3">
                  <p className="text-sm">
                    <strong>Caution:</strong> Limited validation data for populations under 55 years, 
                    certain ethnic groups, and patients with significant neurological comorbidities 
                    (e.g., epilepsy, recent stroke, TBI).
                  </p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Limitations */}
          <AccordionItem value="limitations" className="clinical-card border-none">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-risk-high-bg">
                  <AlertTriangle className="h-5 w-5 text-risk-high" />
                </div>
                <div className="text-left">
                  <h2 className="text-lg font-semibold text-foreground">Known Limitations</h2>
                  <p className="text-sm text-muted-foreground">Important considerations for clinical use</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4 text-muted-foreground">
              <div className="space-y-4 pl-13">
                <ul className="list-inside list-disc space-y-2 text-sm">
                  <li>
                    <strong>Not a diagnostic tool:</strong> Results are risk assessments, not 
                    clinical diagnoses. Diagnosis requires comprehensive clinical evaluation.
                  </li>
                  <li>
                    <strong>EEG quality dependent:</strong> Poor signal quality may affect 
                    accuracy. Always verify signal quality score before interpreting results.
                  </li>
                  <li>
                    <strong>Cannot differentiate dementia subtypes:</strong> The model identifies 
                    cognitive decline patterns but cannot reliably distinguish between 
                    Alzheimer's, vascular, or other dementia types.
                  </li>
                  <li>
                    <strong>Medication effects:</strong> Certain medications (sedatives, 
                    antiepileptics, psychotropics) may affect EEG patterns and model performance.
                  </li>
                  <li>
                    <strong>Acute conditions:</strong> Not validated for use during acute 
                    medical conditions, delirium, or altered mental states.
                  </li>
                  <li>
                    <strong>Longitudinal tracking:</strong> Single time-point assessments 
                    are less reliable than longitudinal trends for monitoring progression.
                  </li>
                </ul>
              </div>
            </AccordionContent>
          </AccordionItem>
          {/* Regulatory Compliance */}
          <AccordionItem value="regulatory" className="clinical-card border-none">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div className="text-left">
                  <h2 className="text-lg font-semibold text-foreground">Regulatory & Compliance</h2>
                  <p className="text-sm text-muted-foreground">Certifications, data privacy, and standards</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4 text-muted-foreground">
              <div className="space-y-4 pl-13">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-lg border border-border p-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-risk-low" />
                      <h4 className="font-semibold text-foreground">HIPAA Compliant</h4>
                    </div>
                    <p className="mt-2 text-sm">
                      Data handling meets HIPAA requirements for protected health information.
                    </p>
                  </div>
                  <div className="rounded-lg border border-border p-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-risk-low" />
                      <h4 className="font-semibold text-foreground">ISO 27001</h4>
                    </div>
                    <p className="mt-2 text-sm">
                      Information security management system certified.
                    </p>
                  </div>
                  <div className="rounded-lg border border-border p-4">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-risk-moderate" />
                      <h4 className="font-semibold text-foreground">CE Mark (Pending)</h4>
                    </div>
                    <p className="mt-2 text-sm">
                      Application submitted for Class IIa medical device certification.
                    </p>
                  </div>
                  <div className="rounded-lg border border-border p-4">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-risk-moderate" />
                      <h4 className="font-semibold text-foreground">CDSCO (Pending)</h4>
                    </div>
                    <p className="mt-2 text-sm">
                      Indian regulatory approval in progress.
                    </p>
                  </div>
                </div>

                <p className="text-sm bg-muted/50 p-3 rounded-lg">
                  <strong>Current Status:</strong> This software is currently designated for 
                  research and clinical decision support only. It should not be used as the 
                  sole basis for clinical diagnosis or treatment decisions.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </MainLayout>
  );
};

export default Evidence;
