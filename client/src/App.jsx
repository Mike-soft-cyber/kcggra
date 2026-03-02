import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

// Public Pages
import Login from './pages/Login'
import Signup from './pages/Signup'
import PublicVisitorQR from './pages/PublicVisitorQR'

// Resident Dashboard Pages
import Dashboard from './pages/Dashboard'
import Community from './pages/Community'
import Incident from './pages/Incident'
import IncidentDetail from './pages/IncidentDetail'
import Payments from './pages/Payments'
import Settings from './pages/Settings'
import ProfilePage from './pages/Profile'
import ActiveSessions from './pages/Sessions'
import Visitors from './pages/Visitor'
import VisitorQR from './pages/VisitorQR'
import GuardMapPage from './pages/GuardMapPage'
import AnnouncementsList from './pages/AnnouncementsList'
import AnnouncementDetail from './pages/AnnouncementDetail'
import AdminProjects from './pages/Projects'

// Guard Dashboard
import GuardDashboard from './pages/GuardDashboard'

// Admin Pages
import AdminDashboard from './pages/AdminDashboard'
import AdminSubscriptions from './pages/AdminSubscriptions'
import AdminCapEx from './pages/AdminCapEx'
import AdminResidents from './pages/AdminResidents'
import AdminPaymentVerification from './pages/AdminPaymentVerification'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* PUBLIC ROUTES */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/visitor/:visitor_id" element={<PublicVisitorQR />} />

        {/* RESIDENT DASHBOARD */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dashboard/incidents" element={<Incident />} />
        <Route path="/dashboard/incidents/:id" element={<IncidentDetail />} />
        <Route path="/dashboard/payments" element={<Payments />} />
        <Route path="/dashboard/community" element={<Community />} />
        <Route path="/dashboard/visitors" element={<Visitors />} />
        <Route path="/dashboard/visitors/:visitor_id" element={<VisitorQR />} />
        <Route path="/qrCode" element={<Navigate to="/dashboard/visitors" replace />} />
        <Route path="/dashboard/guard-map" element={<GuardMapPage />} />
        <Route path="/dashboard/announcements" element={<AnnouncementsList />} />
        <Route path="/dashboard/announcements/:id" element={<AnnouncementDetail />} />
        <Route path="/announcements/:id" element={<Navigate to="/dashboard/announcements/:id" replace />} />
        <Route path="/dashboard/settings" element={<Settings />} />
        <Route path="/dashboard/settings/sessions" element={<ActiveSessions />} />
        <Route path="/dashboard/profile" element={<ProfilePage />} />
        <Route path="/dashboard/projects" element={<AdminProjects />} />

        {/* GUARD DASHBOARD */}
        <Route path="/guard/dashboard" element={<GuardDashboard />} />

        {/* ADMIN ROUTES */}
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/subscriptions" element={<AdminSubscriptions />} />
        <Route path="/admin/capex" element={<AdminCapEx />} />
        <Route path="/admin/residents" element={<AdminResidents />} />
        <Route path="/admin/projects" element={<AdminProjects />} />
        <Route path="/admin/payments/verify" element={<AdminPaymentVerification />} />

        {/* CATCH-ALL */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}