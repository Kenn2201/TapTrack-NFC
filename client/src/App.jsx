import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";

// Layout Guards
import RequireAuth from "./components/layout/RequireAuth";
import RequireRole from "./components/layout/RequireRole";

// Public Pages
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyEmail from "./pages/VerifyEmail";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import TapLanding from "./pages/TapLanding";
import Compatibility from "./pages/Compatibility";

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
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/auth/verify" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/t" element={<TapLanding />} />
          <Route path="/compatibility" element={<Compatibility />} />

          {/* Authenticated User Routes */}
          <Route element={<RequireAuth />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/my-card" element={<MyCard />} />
            <Route path="/events" element={<Events />} />
            <Route path="/events/:id" element={<EventDetailRoute />} />
            <Route path="/attendance" element={<AttendanceHistory />} />
            <Route path="/feedback" element={<FeedbackCenter />} />
          </Route>

          {/* Operator Protected Routes */}
          <Route element={<RequireRole allowedRoles={['OPERATOR', 'ADMIN']} />}>
            <Route path="/operator" element={<Operator />} />
            <Route path="/operator/nfc-reader" element={<NfcReaderPage />} />
            <Route path="/operator/benchmark" element={<Benchmark />} />
          </Route>

          {/* Admin Protected Routes */}
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
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
