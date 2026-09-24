import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";

// Layout Guards
import RequireAuth from "./components/layout/RequireAuth";
import RequireRole from "./components/layout/RequireRole";
import AuthenticatedShell from "./components/layout/AuthenticatedShell";
import AuthShell from "./components/layout/AuthShell";

// Auth Initialization
import AuthInitializer from "./components/AuthInitializer";
// Route reveal transition
import RouteReveal from "./components/RouteReveal";

// Public Pages
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyEmail from "./pages/VerifyEmail";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import TapLanding from "./pages/TapLanding";
import Compatibility from "./pages/Compatibility";
import Changelog from "./pages/Changelog";
import Terminology from "./pages/Terminology";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Terms from "./pages/Terms";
import PublicFeedback from "./pages/PublicFeedback";

// Authenticated User Pages
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import MyCard from "./pages/MyCard";
import Events from "./pages/Events";
import EventDetail from "./pages/EventDetail";
import AttendanceHistory from "./pages/AttendanceHistory";
import FeedbackCenter from "./pages/FeedbackCenter";

// Operator Pages
import Operator from "./pages/Operator";
import NfcReaderPage from "./pages/NfcReaderPage";

// Admin Pages
import AdminDashboard from "./pages/AdminDashboard";
import AdminCards from "./pages/AdminCards";
import AdminUsers from "./pages/AdminUsers";
import AdminEvents from "./pages/AdminEvents";
import AdminFeedback from "./pages/AdminFeedback";
import AdminEmail from "./pages/AdminEmail";
import AdminPlatform from "./pages/AdminPlatform";
import AuditLogs from "./pages/AuditLogs";
import Benchmark from "./pages/Benchmark";
import NotFound from "./pages/NotFound";
import { useParams } from "react-router-dom";

function EventDetailRoute() {
  const { id } = useParams();
  return <EventDetail eventId={Number(id)} />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AuthInitializer>
          <RouteReveal>
          <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route element={<AuthShell />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
          </Route>
          <Route path="/auth/verify" element={<VerifyEmail />} />
          <Route path="/t" element={<TapLanding />} />
          <Route path="/compatibility" element={<Compatibility />} />
          <Route path="/changelog" element={<Changelog />} />
          <Route path="/terminology" element={<Terminology />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/feedback/public" element={<PublicFeedback />} />

          {/* Authenticated / Staff Routes */}
          <Route element={<RequireAuth />}>
            <Route element={<AuthenticatedShell />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/my-card" element={<MyCard />} />
              <Route path="/events" element={<Events />} />
              <Route path="/events/:id" element={<EventDetailRoute />} />
              <Route path="/attendance" element={<AttendanceHistory />} />
              <Route path="/feedback" element={<FeedbackCenter />} />

              <Route element={<RequireRole allowedRoles={['OPERATOR', 'ADMIN']} />}>
                <Route path="/operator" element={<Operator />} />
                <Route path="/operator/nfc-reader" element={<NfcReaderPage />} />
                <Route path="/operator/benchmark" element={<Benchmark />} />
              </Route>

              <Route element={<RequireRole allowedRoles={['ADMIN']} />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/cards" element={<AdminCards />} />
                <Route path="/admin/nfc-cards" element={<AdminCards />} />
                <Route path="/admin/users" element={<AdminUsers />} />
                <Route path="/admin/events" element={<AdminEvents />} />
                <Route path="/admin/audit" element={<AuditLogs />} />
                <Route path="/admin/audits" element={<AuditLogs />} />
                <Route path="/admin/feedback" element={<AdminFeedback />} />
                <Route path="/admin/email" element={<AdminEmail />} />
                <Route path="/admin/platform" element={<AdminPlatform />} />
              </Route>
            </Route>
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
        </RouteReveal>
        </AuthInitializer>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
