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
import About from "./pages/About.tsx";
import Contact from "./pages/Contact.tsx";
import Cookies from "./pages/Cookies.tsx";
import Auth from "./pages/Auth.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import BookingsPage from "./pages/dashboard/BookingsPage.tsx";
import CalendarPage from "./pages/dashboard/CalendarPage.tsx";
import ClientsPage from "./pages/dashboard/ClientsPage.tsx";
import StaffPage from "./pages/dashboard/StaffPage.tsx";
import ShiftsPage from "./pages/dashboard/ShiftsPage.tsx";
import ReviewsPage from "./pages/dashboard/ReviewsPage.tsx";
import InsightsPage from "./pages/dashboard/InsightsPage.tsx";
import CampaignsPage from "./pages/dashboard/CampaignsPage.tsx";

import EmployeeDashboard from "./pages/EmployeeDashboard.tsx";
import Settings from "./pages/Settings.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import PendingApproval from "./pages/PendingApproval.tsx";
import JoinInvite from "./pages/JoinInvite.tsx";
import Kiosk from "./pages/Kiosk.tsx";
import EmbedWidget from "./pages/EmbedWidget.tsx";
import PublicBooking from "./pages/PublicBooking.tsx";
import BookingSuccess from "./pages/BookingSuccess.tsx";
import BookingCancelled from "./pages/BookingCancelled.tsx";
import ManageBooking from "./pages/ManageBooking.tsx";
import SubmitReview from "./pages/SubmitReview.tsx";
import Payments from "./pages/Payments.tsx";
import PaymentsReturn from "./pages/PaymentsReturn.tsx";
import PaymentsRefresh from "./pages/PaymentsRefresh.tsx";
import NotFound from "./pages/NotFound.tsx";
import OAuthConsent from "./pages/OAuthConsent.tsx";
import GuideDetail from "./pages/GuideDetail.tsx";
import AdminGuard from "./components/admin/AdminGuard.tsx";
import AdminLayout from "./components/admin/AdminLayout.tsx";
import AdminOverview from "./pages/admin/AdminOverview.tsx";
import AdminBusinesses from "./pages/admin/AdminBusinesses.tsx";
import AdminInbox from "./pages/admin/AdminInbox.tsx";
import AdminGiftCodes from "./pages/admin/AdminGiftCodes.tsx";
import RequireSubscription from "./components/RequireSubscription.tsx";
import { SubscriptionProvider } from "./hooks/useSubscription.tsx";

import RequireVerifiedEmail from "./components/RequireVerifiedEmail.tsx";
import VerifyEmail from "./pages/VerifyEmail.tsx";
import Onboarding from "./pages/Onboarding.tsx";
import AppLayout from "./components/app/AppLayout.tsx";
import { LocaleProvider } from "./contexts/LocaleContext.tsx";
import CookieBanner from "./components/CookieBanner.tsx";

const queryClient = new QueryClient();

const Guarded = ({ children }: { children: React.ReactNode }) => (
  <RequireVerifiedEmail>
    <SubscriptionProvider>
      <RequireSubscription>{children}</RequireSubscription>
    </SubscriptionProvider>
  </RequireVerifiedEmail>
);


const App = () => (
  <QueryClientProvider client={queryClient}>
    <LocaleProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Index />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/security" element={<Security />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/cookies" element={<Cookies />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/guides/:slug" element={<GuideDetail />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/.lovable/oauth/consent" element={<OAuthConsent />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/pending-approval" element={<RequireVerifiedEmail><PendingApproval /></RequireVerifiedEmail>} />
          <Route path="/join" element={<JoinInvite />} />
          <Route path="/kiosk/:companyCode" element={<Kiosk />} />
          <Route path="/embed/:userId" element={<EmbedWidget />} />
          <Route path="/book/:userId" element={<PublicBooking />} />
          <Route path="/book/:userId/success" element={<BookingSuccess />} />
          <Route path="/book/:userId/cancelled" element={<BookingCancelled />} />
          <Route path="/booking/manage/:token" element={<ManageBooking />} />
          <Route path="/review/:token" element={<SubmitReview />} />
          <Route path="/employee-dashboard" element={<RequireVerifiedEmail><EmployeeDashboard /></RequireVerifiedEmail>} />
          <Route path="/onboarding" element={<RequireVerifiedEmail><Onboarding /></RequireVerifiedEmail>} />

          {/* Authenticated app shell */}
          <Route element={<Guarded><AppLayout /></Guarded>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/bookings" element={<BookingsPage />} />
            <Route path="/dashboard/calendar" element={<CalendarPage />} />
            <Route path="/dashboard/clients" element={<ClientsPage />} />
            <Route path="/dashboard/staff" element={<StaffPage />} />
            <Route path="/dashboard/shifts" element={<ShiftsPage />} />
            <Route path="/dashboard/reviews" element={<ReviewsPage />} />
            <Route path="/dashboard/insights" element={<InsightsPage />} />
            <Route path="/dashboard/campaigns" element={<CampaignsPage />} />


            <Route path="/settings" element={<Settings />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/payments/return" element={<PaymentsReturn />} />
            <Route path="/payments/refresh" element={<PaymentsRefresh />} />
          </Route>

          <Route path="/admin" element={<AdminGuard><AdminLayout><AdminOverview /></AdminLayout></AdminGuard>} />
          <Route path="/admin/businesses" element={<AdminGuard><AdminLayout><AdminBusinesses /></AdminLayout></AdminGuard>} />
          <Route path="/admin/inbox" element={<AdminGuard><AdminLayout><AdminInbox /></AdminLayout></AdminGuard>} />
          <Route path="/admin/gift-codes" element={<AdminGuard><AdminLayout><AdminGiftCodes /></AdminLayout></AdminGuard>} />

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <CookieBanner />
      </BrowserRouter>
    </TooltipProvider>
    </LocaleProvider>
  </QueryClientProvider>
);

export default App;
