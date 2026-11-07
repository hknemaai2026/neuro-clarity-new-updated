import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./app/AuthContext";
import ProtectedRoute from "./app/ProtectedRoute";
import Index from "./pages/Index";
import Upload from "./pages/Upload";
import EegAnalysis from "./pages/EegAnalysis";
import PatientReport from "./pages/PatientReport";
import PatientFriendlyReport from "./pages/PatientFriendlyReport";
import Reports from "./pages/Reports";
import Longitudinal from "./pages/Longitudinal";
import Evidence from "./pages/Evidence";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Login from "./app/Login";
import Signup from "./app/Signup";
import Patients from "./pages/Patients";
import PatientHistory from "./pages/PatientHistory";
import ReportSummary from "./pages/ReportSummary";
import EEGScanReport from "./components/eegscanReport";
import EegTechnicianReport from "./pages/EegTechnicianReport";
import NeuroIntake from "./pages/NeuroIntake";
import AdminKeys from "./pages/AdminKeys";
import Followups from "./pages/Followups";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              }
            />
            <Route
              path="/upload"
              element={
                <ProtectedRoute>
                  <Upload />
                </ProtectedRoute>
              }
            />
            <Route
              path="/eeg-analysis/:resultId?"
              element={
                <ProtectedRoute>
                  <EegAnalysis />
                </ProtectedRoute>
              }
            />
            <Route
              path="/report/:jobId"
              element={
                <ProtectedRoute>
                  <PatientReport />
                </ProtectedRoute>
              }
            />
            <Route
              path="/report/:jobId/patient"
              element={
                <ProtectedRoute>
                  <PatientFriendlyReport />
                </ProtectedRoute>
              }
            />
            <Route
              path="/report-eeg/:jobId"
              element={
                <ProtectedRoute>
                  <EEGScanReport />
                </ProtectedRoute>
              }
            />
            <Route
              path="/eeg-technician-report"
              element={
                <ProtectedRoute>
                  <EegTechnicianReport />
                </ProtectedRoute>
              }
            />
            <Route
              path="/neuro-intake"
              element={
                <ProtectedRoute>
                  <NeuroIntake />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <Reports />
                </ProtectedRoute>
              }
            />
            <Route
              path="/longitudinal"
              element={
                <ProtectedRoute>
                  <Longitudinal />
                </ProtectedRoute>
              }
            />
            <Route
              path="/longitudinal/:patientId"
              element={
                <ProtectedRoute>
                  <Longitudinal />
                </ProtectedRoute>
              }
            />
            <Route
              path="/evidence"
              element={
                <ProtectedRoute>
                  <Evidence />
                </ProtectedRoute> 
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patients"
              element={
                <ProtectedRoute>
                  <Patients />
                </ProtectedRoute>
              }
            />
           
            <Route
              path="/patient-history/:patient_code"
              element={
                <ProtectedRoute>
                  <PatientHistory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/report-summary/:resultId"
              element={
                <ProtectedRoute>
                  <ReportSummary />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminKeys />
                </ProtectedRoute>
              }
            />
            <Route
              path="/followups"
              element={
                <ProtectedRoute>
                  <Followups />
                </ProtectedRoute>
              }
            />
            {/* Standalone admin gate — own secret auth, no JWT required */}
            <Route path="/admin-keys" element={<AdminKeys />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
