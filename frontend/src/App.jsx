import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { SocketProvider } from './context/SocketContext'

import LandingPage from './pages/LandingPage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import VerifyOTPPage from './pages/auth/VerifyOTPPage'
import PatientDashboard from './pages/patient/PatientDashboard'
import FindDoctors from './pages/patient/FindDoctors'
import DoctorProfileView from './pages/patient/DoctorProfile'
import BookAppointment from './pages/patient/BookAppointment'
import MyAppointments from './pages/patient/MyAppointments'
import MyPrescriptions from './pages/patient/MyPrescriptions'
import MyReports from './pages/patient/MyReports'
import SymptomChecker from './pages/patient/SymptomChecker'
import HealthRisk from './pages/patient/HealthRisk'
import PharmacyPage from './pages/patient/PharmacyPage'
import DoctorDashboard from './pages/doctor/DoctorDashboard'
import DoctorAppointments from './pages/doctor/DoctorAppointments'
import PatientDetail from './pages/doctor/PatientDetail'
import CreatePrescription from './pages/doctor/CreatePrescription'
import DoctorPrescriptions from './pages/doctor/DoctorPrescriptions'
import DoctorProfileEdit from './pages/doctor/DoctorProfilePage'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUsers from './pages/admin/AdminUsers'
import AdminDoctors from './pages/admin/AdminDoctors'
import AdminAppointments from './pages/admin/AdminAppointments'
import AdminCategories from './pages/admin/AdminCategories'
import ReceptionistDashboard from './pages/receptionist/ReceptionistDashboard'
import ProfilePage from './pages/shared/ProfilePage'
import NotificationPage from './pages/shared/NotificationPage'
import VideoConsultation from './pages/shared/VideoConsultation'
import NotFound from './pages/NotFound'

function Loader() {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-secondary-900">
      <div className="w-12 h-12 spinner mx-auto" />
    </div>
  )
}

function PrivateRoute({ children, roles }) {
  const { isAuthenticated, user, loading } = useAuth()
  if (loading) return <Loader />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user?.role)) return <Navigate to="/unauthorized" replace />
  return children
}

function PublicRoute({ children }) {
  const { isAuthenticated, user, loading } = useAuth()
  if (loading) return <Loader />
  if (isAuthenticated) {
    const redirects = { admin: '/admin', doctor: '/doctor', receptionist: '/receptionist', patient: '/patient' }
    return <Navigate to={redirects[user?.role] || '/patient'} replace />
  }
  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/verify-otp" element={<VerifyOTPPage />} />
      <Route path="/patient" element={<PrivateRoute roles={['patient']}><PatientDashboard /></PrivateRoute>} />
      <Route path="/patient/find-doctors" element={<PrivateRoute roles={['patient']}><FindDoctors /></PrivateRoute>} />
      <Route path="/patient/doctors/:id" element={<PrivateRoute roles={['patient']}><DoctorProfileView /></PrivateRoute>} />
      <Route path="/patient/book/:doctorId" element={<PrivateRoute roles={['patient']}><BookAppointment /></PrivateRoute>} />
      <Route path="/patient/appointments" element={<PrivateRoute roles={['patient']}><MyAppointments /></PrivateRoute>} />
      <Route path="/patient/prescriptions" element={<PrivateRoute roles={['patient']}><MyPrescriptions /></PrivateRoute>} />
      <Route path="/patient/reports" element={<PrivateRoute roles={['patient']}><MyReports /></PrivateRoute>} />
      <Route path="/patient/symptoms" element={<PrivateRoute roles={['patient']}><SymptomChecker /></PrivateRoute>} />
      <Route path="/patient/health-risk" element={<PrivateRoute roles={['patient']}><HealthRisk /></PrivateRoute>} />
      <Route path="/patient/pharmacy" element={<PrivateRoute roles={['patient']}><PharmacyPage /></PrivateRoute>} />
      <Route path="/doctor" element={<PrivateRoute roles={['doctor']}><DoctorDashboard /></PrivateRoute>} />
      <Route path="/doctor/appointments" element={<PrivateRoute roles={['doctor']}><DoctorAppointments /></PrivateRoute>} />
      <Route path="/doctor/patient/:patientId" element={<PrivateRoute roles={['doctor']}><PatientDetail /></PrivateRoute>} />
      <Route path="/doctor/prescribe/:appointmentId" element={<PrivateRoute roles={['doctor']}><CreatePrescription /></PrivateRoute>} />
      <Route path="/doctor/prescriptions" element={<PrivateRoute roles={['doctor']}><DoctorPrescriptions /></PrivateRoute>} />
      <Route path="/doctor/profile" element={<PrivateRoute roles={['doctor']}><DoctorProfileEdit /></PrivateRoute>} />
      <Route path="/admin" element={<PrivateRoute roles={['admin']}><AdminDashboard /></PrivateRoute>} />
      <Route path="/admin/users" element={<PrivateRoute roles={['admin']}><AdminUsers /></PrivateRoute>} />
      <Route path="/admin/doctors" element={<PrivateRoute roles={['admin']}><AdminDoctors /></PrivateRoute>} />
      <Route path="/admin/appointments" element={<PrivateRoute roles={['admin']}><AdminAppointments /></PrivateRoute>} />
      <Route path="/admin/categories" element={<PrivateRoute roles={['admin']}><AdminCategories /></PrivateRoute>} />
      <Route path="/receptionist" element={<PrivateRoute roles={['receptionist', 'admin']}><ReceptionistDashboard /></PrivateRoute>} />
      <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
      <Route path="/notifications" element={<PrivateRoute><NotificationPage /></PrivateRoute>} />
      <Route path="/consultation/:appointmentId" element={<PrivateRoute><VideoConsultation /></PrivateRoute>} />
      <Route path="/unauthorized" element={
        <div className="flex items-center justify-center h-screen flex-col gap-4 bg-gray-50 dark:bg-secondary-900">
          <div className="text-6xl">🚫</div>
          <h1 className="text-2xl font-bold text-secondary-900 dark:text-white">Access Denied</h1>
          <p className="text-secondary-500">You don't have permission to view this page.</p>
          <a href="/" className="btn-primary px-6 py-3">Go Home</a>
        </div>
      } />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <SocketProvider>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: { borderRadius: '12px', fontSize: '14px', fontWeight: '500', boxShadow: '0 4px 20px rgba(0,0,0,0.12)' },
                success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
                error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } }
              }}
            />
            <AppRoutes />
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
