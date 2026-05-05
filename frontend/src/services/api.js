import axios from 'axios'
import toast from 'react-hot-toast'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
})

// Request interceptor - attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('nc_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor - handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || 'Something went wrong'
    const status = error.response?.status

    if (status === 401) {
      localStorage.removeItem('nc_token')
      localStorage.removeItem('nc_user')
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login'
      }
    } else if (status === 403) {
      toast.error('Access denied')
    } else if (status === 429) {
      toast.error('Too many requests. Please wait.')
    } else if (status >= 500) {
      toast.error('Server error. Please try again.')
    }

    return Promise.reject({ message, status, data: error.response?.data })
  }
)

export default api

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  verifyOTP: (data) => api.post('/auth/verify-otp', data),
  resendOTP: (data) => api.post('/auth/resend-otp', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  changePassword: (data) => api.put('/auth/change-password', data),
  createStaff: (data) => api.post('/auth/create-staff', data)
}

// User API
export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  uploadAvatar: (formData) => api.post('/users/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  registerDoctor: (data) => api.post('/users/register-doctor', data)
}

// Doctor API
export const doctorAPI = {
  getDoctors: (params) => api.get('/doctors', { params }),
  getDoctorById: (id) => api.get(`/doctors/${id}`),
  getAvailableSlots: (id, date) => api.get(`/doctors/${id}/slots`, { params: { date } }),
  getMyProfile: () => api.get('/doctors/my-profile'),
  updateProfile: (data) => api.put('/doctors/profile', data),
  getDashboardStats: () => api.get('/doctors/dashboard'),
  addReview: (id, data) => api.post(`/doctors/${id}/review`, data)
}

// Appointment API
export const appointmentAPI = {
  book: (data) => api.post('/appointments', data),
  getMyAppointments: (params) => api.get('/appointments/my', { params }),
  getDoctorAppointments: (params) => api.get('/appointments/doctor', { params }),
  getAllAppointments: (params) => api.get('/appointments/all', { params }),
  getAppointment: (id) => api.get(`/appointments/${id}`),
  updateStatus: (id, data) => api.put(`/appointments/${id}/status`, data),
  getPatientHistory: (patientId) => api.get(`/appointments/patient/${patientId}/history`)
}

// Prescription API
export const prescriptionAPI = {
  create: (data) => api.post('/prescriptions', data),
  getMyPrescriptions: (params) => api.get('/prescriptions/my', { params }),
  getDoctorPrescriptions: (params) => api.get('/prescriptions/doctor', { params }),
  getPrescription: (id) => api.get(`/prescriptions/${id}`),
  update: (id, data) => api.put(`/prescriptions/${id}`, data)
}

// Report API
export const reportAPI = {
  upload: (formData) => api.post('/reports', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getMyReports: (params) => api.get('/reports/my', { params }),
  getPatientReports: (patientId) => api.get(`/reports/patient/${patientId}`),
  delete: (id) => api.delete(`/reports/${id}`)
}

// Admin API
export const adminAPI = {
  getAnalytics: () => api.get('/admin/analytics'),
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getPendingDoctors: () => api.get('/admin/doctors/pending'),
  approveDoctor: (id, data) => api.put(`/admin/doctors/${id}/approve`, data),
  getCategories: () => api.get('/admin/categories'),
  createCategory: (data) => api.post('/admin/categories', data),
  updateCategory: (id, data) => api.put(`/admin/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/admin/categories/${id}`),
  getBanners: () => api.get('/admin/banners'),
  createBanner: (formData) => api.post('/admin/banners', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteBanner: (id) => api.delete(`/admin/banners/${id}`)
}

// Receptionist API
export const receptionistAPI = {
  createAppointment: (data) => api.post('/receptionist/appointments', data),
  getQueue: (doctorId) => api.get(`/receptionist/queue/${doctorId}`),
  searchPatient: (q) => api.get('/receptionist/search-patient', { params: { q } })
}

// Notification API
export const notificationAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all')
}

// Pharmacy API
export const pharmacyAPI = {
  getPharmacies: () => api.get('/pharmacy/pharmacies'),
  placeOrder: (data) => api.post('/pharmacy/order', data),
  getMyOrders: () => api.get('/pharmacy/my-orders')
}

// AI API
export const aiAPI = {
  checkSymptoms: (data) => api.post('/ai/symptoms', data),
  analyzeHealthRisk: (data) => api.post('/ai/health-risk', data),
  analyzeReport: (data) => api.post('/ai/analyze-report', data)
}

// Category API
export const categoryAPI = {
  getAll: () => api.get('/categories')
}
