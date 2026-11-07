const fs = require('fs');

const liveJs = fs.readFileSync('live-bundle.js', 'utf8');
const localJs = fs.readFileSync('dist/assets/index-06nbnPCX.js', 'utf8');

const pages = [
  { name: 'Login', path: '/login', localFile: 'src/app/Login.tsx' },
  { name: 'Signup', path: '/signup', localFile: 'src/app/Signup.tsx' },
  { name: 'Dashboard (Overview)', path: '/', localFile: 'src/pages/Index.tsx' },
  { name: 'EEG Insights / Upload', path: '/upload', localFile: 'src/pages/Upload.tsx' },
  { name: 'Patient Directory', path: '/patients', localFile: 'src/pages/Patients.tsx' },
  { name: 'Patient Reports', path: '/reports', localFile: 'src/pages/Reports.tsx' },
  { name: 'Patient History', path: '/patient-history/:patient_code', localFile: 'src/pages/PatientHistory.tsx' },
  { name: 'Patient Report (Cognitive)', path: '/report/:jobId', localFile: 'src/pages/PatientReport.tsx' },
  { name: 'Patient Report (Patient View)', path: '/report/:jobId/patient', localFile: 'N/A' },
  { name: 'EEG Scan Report', path: '/report-eeg/:jobId', localFile: 'src/components/eegscanReport.tsx' },
  { name: 'Report Summary', path: '/report-summary/:resultId', localFile: 'src/pages/ReportSummary.tsx' },
  { name: 'EEG Technician Report', path: '/eeg-technician-report', localFile: 'src/pages/EegTechnicianReport.tsx' },
  { name: 'Neuro Intake Form', path: '/neuro-intake', localFile: 'src/pages/NeuroIntake.tsx' },
  { name: 'Longitudinal Tracking', path: '/longitudinal', localFile: 'src/pages/Longitudinal.tsx' },
  { name: 'Model Evidence & Validation', path: '/evidence', localFile: 'src/pages/Evidence.tsx' },
  { name: 'Settings', path: '/settings', localFile: 'src/pages/Settings.tsx' },
  { name: 'Follow-Ups', path: '/followups', localFile: 'src/pages/Followups.tsx' },
  { name: 'Admin Dashboard', path: '/admin', localFile: 'src/pages/AdminKeys.tsx' },
  { name: 'Admin Keys Gate', path: '/admin-keys', localFile: 'src/pages/AdminKeysGate.tsx' },
  { name: 'EEG Analysis', path: '/eeg-analysis/:resultId?', localFile: 'src/pages/EegAnalysis.tsx' }
];

console.log('Comparing pages across Live and Local...');

for (const p of pages) {
  const inLive = liveJs.includes(p.path);
  const inLocal = localJs.includes(p.path);
  console.log(`Page: ${p.name.padEnd(30)} | Route: ${p.path.padEnd(30)} | Live: ${inLive ? 'YES' : 'NO '} | Local: ${inLocal ? 'YES' : 'NO '}`);
}
