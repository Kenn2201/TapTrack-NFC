import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import MyCard from "./pages/MyCard";
import Events from "./pages/Events";
import TapLanding from "./pages/TapLanding";
import Operator from "./pages/Operator";
import AdminDashboard from "./pages/AdminDashboard";
import AdminCards from "./pages/AdminCards";
import AdminUsers from "./pages/AdminUsers";
import AdminEvents from "./pages/AdminEvents";
import AttendanceHistory from "./pages/AttendanceHistory";
import AuditLogs from "./pages/AuditLogs";
import Compatibility from "./pages/Compatibility";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/t" element={<TapLanding />} />
        <Route path="/compatibility" element={<Compatibility />} />

        {/* User */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/my-card" element={<MyCard />} />
        <Route path="/events" element={<Events />} />
        <Route path="/attendance" element={<AttendanceHistory />} />

        {/* Operator */}
        <Route path="/operator" element={<Operator />} />

        {/* Admin */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/cards" element={<AdminCards />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/events" element={<AdminEvents />} />
        <Route path="/admin/audit" element={<AuditLogs />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
