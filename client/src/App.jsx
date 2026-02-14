import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Community from './pages/Community'
import Incident from './pages/Incident'
import Login from './pages/Login'
import Payments from './pages/Payments'
import Settings from './pages/Settings'
import Signup from './pages/Signup'
import ProfilePage from './pages/Profile'
import PublicVisitorQR from './pages/PublicVisitorQR'
import ActiveSessions from './pages/Sessions'
import AdminProjects from './pages/Projects'
import Visitors from './pages/Visitor'
import VisitorQR from './pages/VisitorQR'
import GuardMapPage from './pages/GuardMapPage'
import AnnouncementsList from './pages/AnnouncementsList'
import AnnouncementDetail from './pages/AnnouncementDetail'
import IncidentDetail from './pages/IncidentDetail'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        {/* Public Visitor QR (no auth) */}
        <Route path="/visitor/:visitor_id" element={<PublicVisitorQR />} />

        {/* Protected Dashboard Routes */}
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* Incidents */}
        <Route path="/dashboard/incidents" element={<Incident />} />
        <Route path="/dashboard/incidents/:id" element={<IncidentDetail />} />
        
        {/* Payments */}
        <Route path="/dashboard/payments" element={<Payments />} />
        
        {/* Community */}
        <Route path="/dashboard/community" element={<Community />} />
        
        {/* Visitors - FIX YOUR DASHBOARD NAVIGATION */}
        <Route path="/dashboard/visitors" element={<Visitors />} />
        <Route path="/dashboard/visitors/:visitor_id" element={<VisitorQR />} />
        {/* Legacy route redirect */}
        <Route path="/qrCode" element={<Navigate to="/dashboard/visitors" replace />} />
        
        {/* Guard Map */}
        <Route path="/dashboard/guard-map" element={<GuardMapPage />} />
        
        {/* Announcements */}
        <Route path="/dashboard/announcements" element={<AnnouncementsList />} />
        <Route path="/dashboard/announcements/:id" element={<AnnouncementDetail />} />
        {/* Legacy route redirect */}
        <Route path="/announcements/:id" element={<Navigate to="/dashboard/announcements/:id" replace />} />
        
        {/* Settings & Profile */}
        <Route path="/dashboard/settings" element={<Settings />} />
        <Route path="/dashboard/settings/sessions" element={<ActiveSessions />} />
        <Route path="/dashboard/profile" element={<ProfilePage />} />

        {/* Admin Routes */}
        <Route path="/admin/projects" element={<AdminProjects />} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}