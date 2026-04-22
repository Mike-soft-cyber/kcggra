import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'

// Public Pages
import Login from './pages/Login'
import PublicVisitorQR from './pages/PublicVisitorQR'

import DashboardLayout from './components/DashboardLayout'

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
import AdminSecretLogin from './pages/AdminSecretLogin';

const ADMIN_SLUG = import.meta.env.VITE_ADMIN_SLUG || 'change-this-in-env';


export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* PUBLIC ROUTES */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/visitor/:visitor_id" element={<PublicVisitorQR />} />

        {/* RESIDENT DASHBOARD */}
        <Route element={<DashboardLayout />}>
        <Route path="/dashboard" element={
          <ProtectedRoute allowedRoles={['resident']}>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/incidents" element={
          <ProtectedRoute allowedRoles={['resident']}>
            <Incident />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/incidents/:id" element={
          <ProtectedRoute allowedRoles={['resident']}>
            <IncidentDetail />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/payments" element={
          <ProtectedRoute allowedRoles={['resident']}>
            <Payments />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/community" element={
          <ProtectedRoute allowedRoles={['resident']}>
            <Community />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/visitors" element={
          <ProtectedRoute allowedRoles={['resident']}>
            <Visitors />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/visitors/:visitor_id" element={
          <ProtectedRoute allowedRoles={['resident']}>
            <VisitorQR />
          </ProtectedRoute>
        } />
        <Route path="/qrCode" element={<Navigate to="/dashboard/visitors" replace />} />
        <Route path="/dashboard/guard-map" element={
          <ProtectedRoute allowedRoles={['resident']}>
            <GuardMapPage />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/announcements" element={
          <ProtectedRoute allowedRoles={['resident']}>
            <AnnouncementsList />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/announcements/:id" element={
          <ProtectedRoute allowedRoles={['resident']}>
            <AnnouncementDetail />
          </ProtectedRoute>
        } />
        <Route path="/announcements/:id" element={
          <Navigate to="/dashboard/announcements/:id" replace />
        } />
        <Route path="/dashboard/settings" element={
          <ProtectedRoute allowedRoles={['resident']}>
            <Settings />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/settings/sessions" element={
          <ProtectedRoute allowedRoles={['resident']}>
            <ActiveSessions />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/profile" element={
          <ProtectedRoute allowedRoles={['resident']}>
            <ProfilePage />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/projects" element={
          <ProtectedRoute allowedRoles={['resident']}>
            <AdminProjects />
          </ProtectedRoute>
        } />
        </Route>

        {/* GUARD DASHBOARD */}
        <Route path="/guard/dashboard" element={
          <ProtectedRoute allowedRoles={['guard']}>
            <GuardDashboard />
          </ProtectedRoute>
        } />

        {/* ADMIN ROUTES */}
        <Route path="/admin/dashboard" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin/subscriptions" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminSubscriptions />
          </ProtectedRoute>
        } />
        <Route path="/admin/capex" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminCapEx />
          </ProtectedRoute>
        } />
        <Route path="/admin/residents" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminResidents />
          </ProtectedRoute>
        } />
        <Route path="/admin/projects" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminProjects />
          </ProtectedRoute>
        } />
        <Route path="/admin/payments/verify" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminPaymentVerification />
          </ProtectedRoute>
        } />

         <Route
          path={`/portal/${ADMIN_SLUG}`}
          element={<AdminSecretLogin />}
        />

        {/* CATCH-ALL */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}