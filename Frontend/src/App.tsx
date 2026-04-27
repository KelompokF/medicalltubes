import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import PatientLayout from "@/layouts/PatientLayout";
import AdminLayout from "@/layouts/AdminLayout";
import DoctorLayout from "@/layouts/DoctorLayout";
import AmbulanceLayout from "@/layouts/AmbulanceLayout";

import LandingPage from "@/pages/LandingPage";
import PatientLoginPage from "@/pages/auth/PatientLoginPage";
import PatientDashboard from "@/pages/patient/PatientDashboard";
import SearchDoctorPage from "@/pages/patient/SearchDoctorPage";
import DoctorDetailPage from "@/pages/patient/DoctorDetailPage";
import ConsultationChatPage from "@/pages/patient/ConsultationChatPage";
import ChatHistoryPage from "@/pages/patient/ChatHistoryPage";
import HomeVisitBookingPage from "@/pages/patient/HomeVisitBookingPage";
import HomeVisitTrackingPage from "@/pages/patient/HomeVisitTrackingPage";
import HomeVisitHistoryPage from "@/pages/patient/HomeVisitHistoryPage";
import EmergencyPage from "@/pages/patient/EmergencyPage";
import UserProfilePage from "@/pages/patient/UserProfilePage";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import DoctorDashboard from "@/pages/doctor/DoctorDashboard";
import DoctorConsultationPage from "@/pages/doctor/DoctorConsultationPage";
import AmbulanceDashboard from "@/pages/ambulance/AmbulanceDashboard";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const ComingSoon = ({ title }: { title: string }) => (
  <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
    <div className="rounded-full bg-primary/10 p-6 mb-4">
      <div className="h-8 w-8 text-primary">🚧</div>
    </div>
    <h2 className="text-xl font-bold text-foreground">{title}</h2>
    <p className="text-muted-foreground mt-2">This page is under development.</p>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomeVisitBookingPage />} />
          <Route path="/login" element={<PatientLoginPage />} />
          <Route path="/login/patient" element={<Navigate to="/login" replace />} />
          <Route path="/register" element={<PatientLoginPage />} />

          {/* Patient Routes */}
          <Route element={<PatientLayout />}>
            <Route path="/dashboard" element={<PatientDashboard />} />
            <Route path="/search-doctor" element={<SearchDoctorPage />} />
            <Route path="/doctor/:id" element={<DoctorDetailPage />} />
            <Route path="/chat" element={<ConsultationChatPage />} />
            <Route path="/chat-history" element={<ChatHistoryPage />} />
            <Route path="/home-visit" element={<HomeVisitBookingPage />} />
            <Route path="/home-visit-history" element={<HomeVisitHistoryPage />} />
            <Route path="/tracking" element={<HomeVisitTrackingPage />} />
            <Route path="/emergency" element={<EmergencyPage />} />
            <Route path="/profile" element={<UserProfilePage />} />
          </Route>

          {/* Admin Routes */}
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/emergencies" element={<ComingSoon title="Emergency Monitor" />} />
            <Route path="/admin/consultations" element={<ComingSoon title="Consultations" />} />
            <Route path="/admin/settings" element={<ComingSoon title="Admin Settings" />} />
          </Route>

          {/* Doctor Routes */}
          <Route element={<DoctorLayout />}>
            <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
            <Route path="/doctor-dashboard/patients" element={<ComingSoon title="My Patients" />} />
            <Route path="/doctor-dashboard/consultations" element={<DoctorConsultationPage />} />
            <Route path="/doctor-dashboard/home-visits" element={<ComingSoon title="Home Visits" />} />
            <Route path="/doctor-dashboard/schedule" element={<ComingSoon title="Schedule Management" />} />
            <Route path="/doctor-dashboard/prescriptions" element={<ComingSoon title="Prescriptions" />} />
            <Route path="/doctor-dashboard/records" element={<ComingSoon title="Medical Records" />} />
            <Route path="/doctor-dashboard/settings" element={<ComingSoon title="Doctor Settings" />} />
          </Route>

          {/* Ambulance Routes */}
          <Route element={<AmbulanceLayout />}>
            <Route path="/ambulance-dashboard" element={<AmbulanceDashboard />} />
            <Route path="/ambulance-dashboard/active" element={<ComingSoon title="Active Emergencies" />} />
            <Route path="/ambulance-dashboard/tracking" element={<ComingSoon title="Live Tracking" />} />
            <Route path="/ambulance-dashboard/fleet" element={<ComingSoon title="Fleet Status" />} />
            <Route path="/ambulance-dashboard/history" element={<ComingSoon title="Emergency History" />} />
            <Route path="/ambulance-dashboard/settings" element={<ComingSoon title="Ambulance Settings" />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
