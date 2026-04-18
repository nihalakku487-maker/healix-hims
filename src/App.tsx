import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import BookSlot from "./pages/BookSlot.tsx";
import Confirmation from "./pages/Confirmation.tsx";
import ClinicDashboard from "./pages/ClinicDashboard.tsx";
import DepartmentPage from "./pages/DepartmentPage.tsx";
import FrontDeskCheckIn from "./pages/FrontDeskCheckIn.tsx";
import PatientProfile from "./pages/PatientProfile.tsx";
import NotFound from "./pages/NotFound.tsx";
import Login from "./pages/Login.tsx";

import DoctorDashboard from "./pages/DoctorDashboard.tsx";
import AdminDashboard from "./pages/AdminDashboard.tsx";
import PatientTracker from "./pages/PatientTracker.tsx";
import HospitalAnalytics from "./pages/HospitalAnalytics.tsx";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {import.meta.env.VITE_APP_TYPE === 'hospital' ? (
              // HOSPITAL MODE ROUTES
              <>
                <Route path="/" element={<Login />} />
                <Route path="/login" element={<Login />} />
                <Route path="/doctor" element={<DoctorDashboard />} />
                <Route path="/clinic" element={<ClinicDashboard />} />
                <Route path="/analytics" element={<HospitalAnalytics />} />
                <Route path="/frontdesk/checkin" element={<FrontDeskCheckIn />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="*" element={<Login />} />
              </>
            ) : import.meta.env.VITE_APP_TYPE === 'patient' ? (
              // PATIENT MODE ROUTES
              <>
                <Route path="/" element={<Index />} />
                <Route path="/book/:doctorId" element={<BookSlot />} />
                <Route path="/confirmation/:id" element={<Confirmation />} />
                <Route path="/status" element={<PatientTracker />} />
                <Route path="/analytics" element={<HospitalAnalytics />} />
                <Route path="*" element={<Index />} />
              </>
            ) : (
              // UNIFIED MODE (DEVELOPMENT)
              <>
                <Route path="/" element={<Index />} />
                <Route path="/book/:doctorId" element={<BookSlot />} />
                <Route path="/confirmation/:id" element={<Confirmation />} />
                <Route path="/login" element={<Login />} />
                <Route path="/doctor" element={<DoctorDashboard />} />
                <Route path="/clinic" element={<ClinicDashboard />} />
                <Route path="/analytics" element={<HospitalAnalytics />} />
                <Route path="/frontdesk/checkin" element={<FrontDeskCheckIn />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/status" element={<PatientTracker />} />
                <Route path="*" element={<NotFound />} />
              </>
            )}
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
