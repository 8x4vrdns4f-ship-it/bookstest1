import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import Pricing from "./pages/Pricing.tsx";
import Auth from "./pages/Auth.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import EmployeeDashboard from "./pages/EmployeeDashboard.tsx";
import Settings from "./pages/Settings.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import PendingApproval from "./pages/PendingApproval.tsx";
import Kiosk from "./pages/Kiosk.tsx";
import EmbedWidget from "./pages/EmbedWidget.tsx";
import PublicBooking from "./pages/PublicBooking.tsx";
import NotFound from "./pages/NotFound.tsx";
import RequireSubscription from "./components/RequireSubscription.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<RequireSubscription><Dashboard /></RequireSubscription>} />
          <Route path="/employee-dashboard" element={<EmployeeDashboard />} />
          <Route path="/settings" element={<RequireSubscription><Settings /></RequireSubscription>} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/pending-approval" element={<PendingApproval />} />
          <Route path="/kiosk/:companyCode" element={<Kiosk />} />
          <Route path="/embed/:userId" element={<EmbedWidget />} />
          <Route path="/book/:userId" element={<PublicBooking />} />

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
