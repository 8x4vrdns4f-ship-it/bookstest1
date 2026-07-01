import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import Pricing from "./pages/Pricing.tsx";
import Privacy from "./pages/Privacy.tsx";
import Terms from "./pages/Terms.tsx";
import Security from "./pages/Security.tsx";
import Auth from "./pages/Auth.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import EmployeeDashboard from "./pages/EmployeeDashboard.tsx";
import Settings from "./pages/Settings.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import PendingApproval from "./pages/PendingApproval.tsx";
import Kiosk from "./pages/Kiosk.tsx";
import EmbedWidget from "./pages/EmbedWidget.tsx";
import PublicBooking from "./pages/PublicBooking.tsx";
import BookingSuccess from "./pages/BookingSuccess.tsx";
import BookingCancelled from "./pages/BookingCancelled.tsx";
import Payments from "./pages/Payments.tsx";
import PaymentsReturn from "./pages/PaymentsReturn.tsx";
import PaymentsRefresh from "./pages/PaymentsRefresh.tsx";
import NotFound from "./pages/NotFound.tsx";
import RequireSubscription from "./components/RequireSubscription.tsx";
import RequireVerifiedEmail from "./components/RequireVerifiedEmail.tsx";
import VerifyEmail from "./pages/VerifyEmail.tsx";
import { LocaleProvider } from "./contexts/LocaleContext.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LocaleProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/security" element={<Security />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/dashboard" element={<RequireVerifiedEmail><RequireSubscription><Dashboard /></RequireSubscription></RequireVerifiedEmail>} />
          <Route path="/employee-dashboard" element={<RequireVerifiedEmail><EmployeeDashboard /></RequireVerifiedEmail>} />
          <Route path="/settings" element={<RequireVerifiedEmail><RequireSubscription><Settings /></RequireSubscription></RequireVerifiedEmail>} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/pending-approval" element={<RequireVerifiedEmail><PendingApproval /></RequireVerifiedEmail>} />
          <Route path="/kiosk/:companyCode" element={<Kiosk />} />
          <Route path="/embed/:userId" element={<EmbedWidget />} />
          <Route path="/book/:userId" element={<PublicBooking />} />
          <Route path="/book/:userId/success" element={<BookingSuccess />} />
          <Route path="/book/:userId/cancelled" element={<BookingCancelled />} />
          <Route path="/payments" element={<RequireVerifiedEmail><RequireSubscription><Payments /></RequireSubscription></RequireVerifiedEmail>} />
          <Route path="/payments/return" element={<RequireVerifiedEmail><RequireSubscription><PaymentsReturn /></RequireSubscription></RequireVerifiedEmail>} />
          <Route path="/payments/refresh" element={<RequireVerifiedEmail><RequireSubscription><PaymentsRefresh /></RequireSubscription></RequireVerifiedEmail>} />

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
    </LocaleProvider>
  </QueryClientProvider>
);

export default App;
