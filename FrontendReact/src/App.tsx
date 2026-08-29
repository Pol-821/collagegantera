import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { CollaSettingsProvider } from '@/contexts/CollaSettingsContext'
import { Toaster } from 'sonner'
import Layout from '@/components/Layout'
import Landing from '@/pages/Landing'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import Dashboard from '@/pages/Dashboard'
import Events from '@/pages/Events'
import EventDetail from '@/pages/EventDetail'
import Calendar from '@/pages/Calendar'
import EventRegistration from '@/pages/EventRegistration'
import EventGallery from '@/pages/EventGallery'
import EventAssignments from '@/pages/EventAssignments'
import StageDesigner from '@/pages/StageDesigner'
import Surveys from '@/pages/Surveys'
import AdminRoles from '@/pages/AdminRoles'
import AdminSettings from '@/pages/AdminSettings'
import EventRoles from '@/pages/EventRoles'
import Notifications from '@/pages/Notifications'
import Profile from '@/pages/Profile'
import Announcements from '@/pages/Announcements'
import Family from '@/pages/Family'
import Gallery from '@/pages/Gallery'
import PrivacyPolicy from '@/pages/PrivacyPolicy'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  if (isLoading) return null
  if (!user?.roles?.includes('Admin')) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

function OrganizerRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  if (isLoading) return null
  if (!user?.roles?.some(r => ['Admin', 'OrganitzadorTrobades', 'OrganitzadorAssajos'].includes(r)))
    return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <CollaSettingsProvider>
        <AuthProvider>
          <Toaster richColors position="top-center" />
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/politica-privacitat" element={<PrivacyPolicy />} />

            {/* Protected routes with layout */}
            <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/esdeveniments" element={<Events />} />
              <Route path="/esdeveniment/:id" element={<EventDetail />} />
              <Route path="/esdeveniment/:id/inscripcio" element={<EventRegistration />} />
              <Route path="/esdeveniment/:id/galeria" element={<EventGallery />} />
              <Route path="/esdeveniment/:id/assignacions" element={<EventAssignments />} />
              <Route path="/esdeveniment/:id/escenari" element={<StageDesigner />} />
              <Route path="/calendari" element={<Calendar />} />
              <Route path="/enquestes" element={<Surveys />} />
              <Route path="/notificacions" element={<Notifications />} />
              <Route path="/perfil" element={<Profile />} />
              <Route path="/anuncis" element={<Announcements />} />
              <Route path="/familia" element={<Family />} />
              <Route path="/galeria" element={<Gallery />} />
              <Route path="/admin/rols" element={<AdminRoute><AdminRoles /></AdminRoute>} />
              <Route path="/admin/configuracio" element={<AdminRoute><AdminSettings /></AdminRoute>} />
              <Route path="/organitzacio/rols-esdeveniment" element={<OrganizerRoute><EventRoles /></OrganizerRoute>} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
        </CollaSettingsProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
