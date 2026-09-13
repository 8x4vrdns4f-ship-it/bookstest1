import { Suspense, lazy, useEffect, useState } from "react";
import ErrorBoundary from "./components/ErrorBoundary.tsx";
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
import GuideDetail from "./pages/GuideDetail.tsx";
import RequireSubscription from "./components/RequireSubscription.tsx";
import { SubscriptionProvider } from "./hooks/useSubscription.tsx";

import RequireVerifiedEmail from "./components/RequireVerifiedEmail.tsx";
import AppLayout from "./components/app/AppLayout.tsx";
import { LocaleProvider } from "./contexts/LocaleContext.tsx";
import CookieBanner from "./components/CookieBanner.tsx";

const Auth = lazy(() => import("./pages/Auth.tsx"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail.tsx"));
const ResetPassword = lazy(() => import("./pages/ResetPassword.tsx"));
const PendingApproval = lazy(() => import("./pages/PendingApproval.tsx"));
const JoinInvite = lazy(() => import("./pages/JoinInvite.tsx"));
const Kiosk = lazy(() => import("./pages/Kiosk.tsx"));
const EmbedWidget = lazy(() => import("./pages/EmbedWidget.tsx"));
const PublicBooking = lazy(() => import("./pages/PublicBooking.tsx"));
const BookingSuccess = lazy(() => import("./pages/BookingSuccess.tsx"));
const BookingCancelled = lazy(() => import("./pages/BookingCancelled.tsx"));
const ManageBooking = lazy(() => import("./pages/ManageBooking.tsx"));
const MyBookings = lazy(() => import("./pages/MyBookings.tsx"));
const MyBookingsVerify = lazy(() => import("./pages/MyBookingsVerify.tsx"));
const SubmitReview = lazy(() => import("./pages/SubmitReview.tsx"));
const OAuthConsent = lazy(() => import("./pages/OAuthConsent.tsx"));
const Onboarding = lazy(() => import("./pages/Onboarding.tsx"));
const EmployeeDashboard = lazy(() => import("./pages/EmployeeDashboard.tsx"));

const Dashboard = lazy(() => import("./pages/Dashboard.tsx"));
const BookingsPage = lazy(() => import("./pages/dashboard/BookingsPage.tsx"));
const CalendarPage = lazy(() => import("./pages/dashboard/CalendarPage.tsx"));
const ClientsPage = lazy(() => import("./pages/dashboard/ClientsPage.tsx"));
const StaffPage = lazy(() => import("./pages/dashboard/StaffPage.tsx"));
const ShiftsPage = lazy(() => import("./pages/dashboard/ShiftsPage.tsx"));
const ReviewsPage = lazy(() => import("./pages/dashboard/ReviewsPage.tsx"));
const InsightsPage = lazy(() => import("./pages/dashboard/InsightsPage.tsx"));
const CampaignsPage = lazy(() => import("./pages/dashboard/CampaignsPage.tsx"));
const Settings = lazy(() => import("./pages/Settings.tsx"));
const Payments = lazy(() => import("./pages/Payments.tsx"));
const PaymentsReturn = lazy(() => import("./pages/PaymentsReturn.tsx"));
const PaymentsRefresh = lazy(() => import("./pages/PaymentsRefresh.tsx"));

const AdminGuard = lazy(() => import("./components/admin/AdminGuard.tsx"));
const AdminLayout = lazy(() => import("./components/admin/AdminLayout.tsx"));
const AdminOverview = lazy(() => import("./pages/admin/AdminOverview.tsx"));
const AdminBusinesses = lazy(() => import("./pages/admin/AdminBusinesses.tsx"));
const AdminInbox = lazy(() => import("./pages/admin/AdminInbox.tsx"));
const AdminGiftCodes = lazy(() => import("./pages/admin/AdminGiftCodes.tsx"));
const AdminBookings = lazy(() => import("./pages/admin/AdminBookings.tsx"));
const AdminSubscriptions = lazy(() => import("./pages/admin/AdminSubscriptions.tsx"));

const NotFound = lazy(() => import("./pages/NotFound.tsx"));

const queryClient = new QueryClient();

const PageFallback = () => {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(() => setShow(true), 200);
    return () => window.clearTimeout(id);
  }, []);
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      {show && (
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      )}
    </div>
  );
};

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
        <Suspense fallback={<PageFallback />}>
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
          <Route path="/my-bookings" element={<MyBookings />} />
          <Route path="/my-bookings/verify" element={<MyBookingsVerify />} />
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
          <Route path="/admin/bookings" element={<AdminGuard><AdminLayout><AdminBookings /></AdminLayout></AdminGuard>} />
          <Route path="/admin/subscriptions" element={<AdminGuard><AdminLayout><AdminSubscriptions /></AdminLayout></AdminGuard>} />
          <Route path="/admin/inbox" element={<AdminGuard><AdminLayout><AdminInbox /></AdminLayout></AdminGuard>} />
          <Route path="/admin/gift-codes" element={<AdminGuard><AdminLayout><AdminGiftCodes /></AdminLayout></AdminGuard>} />

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
        <CookieBanner />
      </BrowserRouter>
    </TooltipProvider>
    </LocaleProvider>
  </QueryClientProvider>
);

export default App;
