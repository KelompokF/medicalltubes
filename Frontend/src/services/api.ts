import axios from "axios";

// Base API configuration — point to your FastAPI backend
// Default to backend root (no /api/v1) since backend routes use /auth, /chat, etc.
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8001";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 5000,
});

// Request interceptor — attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;

// ============================================
// AUTH ENDPOINTS
// ============================================
export const authService = {
  login: (data: { email: string; password: string }) =>
    api.post("/auth/login", data),
  register: (data: { full_name: string; email: string; password: string }) =>
    api.post("/auth/register", data),
  getMe: () => api.get("/auth/me"),
  forgotPassword: (email: string) =>
    api.post("/auth/forgot-password", { email }),
  resetPassword: (data: { token: string; password: string }) =>
    api.post("/auth/reset-password", data),
};

// ============================================
// PATIENT ENDPOINTS
// ============================================
export const patientService = {
  getDashboard: () => api.get("/patient/dashboard"),
  getProfile: () => api.get("/patient/profile"),
  updateProfile: (data: any) => api.put("/patient/profile", data),
  deleteAccount: () => api.delete("/patient/account"),
  // Location Sharing
  getLocationSharing: () => api.get("/users/me/location-sharing"),
  updateLocationSharing: (enabled: boolean) =>
    api.patch("/users/me/location-sharing", { enabled }),
};

// ============================================
// DOCTOR ENDPOINTS
// ============================================
export const doctorService = {
  searchDoctors: (params: {
    search?: string;
    specialization?: string;
    lat?: number;
    lng?: number;
    radius_km?: number;
  }) => api.get("/doctors", { params }),
  getDoctorById: (id: string) => api.get(`/doctors/${id}`),
  startConsultation: (doctorId: string) =>
    api.post("/doctors/start-consultation", { doctor_id: doctorId }),
  // Doctor dashboard
  getDashboard: () => api.get("/doctor/dashboard"),
  getPatientRequests: () => api.get("/doctor/requests"),
  acceptRequest: (id: string) => api.post(`/doctor/requests/${id}/accept`),
  createPrescription: (data: any) => api.post("/doctor/prescriptions", data),
};

// ============================================
// CONSULTATION / CHAT ENDPOINTS
// ============================================
export const consultationService = {
  startConsultation: (doctorId: string) =>
    api.post("/consultations", { doctor_id: doctorId }),
  getConversations: () => api.get("/consultations/conversations"),
  getMessages: (conversationId: string) =>
    api.get(`/consultations/${conversationId}/messages`),
  sendMessage: (conversationId: string, message: string) =>
    api.post(`/consultations/${conversationId}/messages`, { message }),
  getChatHistory: (params?: { search?: string; date_filter?: string }) =>
    api.get("/consultations/history", { params }),
};

// ============================================
// HOME VISIT ENDPOINTS
// ============================================
export const homeVisitService = {
  /** Buat permintaan home visit baru (POST /home-visit/) */
  createRequest: (data: {
    patient_name: string;
    address: string;
    phone_number: string;
    complaint: string;
    preferred_date: string;
  }) => api.post("/home-visit/", data),

  /** Ambil semua permintaan home visit milik user yang login (GET /home-visit/) */
  getMyRequests: () => api.get("/home-visit/"),

  /** Ambil detail satu permintaan berdasarkan ID (GET /home-visit/{id}) */
  getRequestById: (id: string) => api.get(`/home-visit/${id}`),
};

// ============================================
// EMERGENCY ENDPOINTS
// ============================================
export const emergencyService = {
  requestEmergency: (data: { location: { lat: number; lng: number }; type?: string }) =>
    api.post("/emergencies", data),
  getNearbyAmbulances: (lat: number, lng: number) =>
    api.get("/emergencies/ambulances", { params: { lat, lng } }),
  getEmergencyStatus: (id: string) => api.get(`/emergencies/${id}/status`),
  callAmbulance: (ambulanceId: string) =>
    api.post(`/emergencies/ambulances/${ambulanceId}/call`),
};

// ============================================
// ADMIN ENDPOINTS
// ============================================
export const adminService = {
  getDashboard: () => api.get("/admin/dashboard"),
  getUsers: (params?: { page?: number; role?: string }) =>
    api.get("/admin/users", { params }),
  getDoctors: (params?: { page?: number }) =>
    api.get("/admin/doctors", { params }),
  getAnalytics: (params?: { period?: string }) =>
    api.get("/admin/analytics", { params }),
  getActiveEmergencies: () => api.get("/admin/emergencies"),
  updateUserStatus: (userId: string, status: string) =>
    api.patch(`/admin/users/${userId}`, { status }),
};

// ============================================
// AMBULANCE ENDPOINTS
// ============================================
export const ambulanceService = {
  getDashboard: () => api.get("/ambulance/dashboard"),
  getIncomingRequests: () => api.get("/ambulance/requests"),
  updateStatus: (requestId: string, status: "on_route" | "arrived" | "completed") =>
    api.post(`/ambulance/requests/${requestId}/status`, { status }),
  getHistory: () => api.get("/ambulance/history"),
};

// ============================================
// PRESCRIPTION ENDPOINTS
// ============================================
export const prescriptionService = {
  create: (data: any) => api.post("/prescriptions", data),
  getRoomPrescriptions: (roomId: string) => api.get(`/prescriptions/room/${roomId}`),
  getPatientPrescriptions: (patientId: string) => api.get(`/prescriptions/patient/${patientId}`),
};

// ============================================
// HEALTH RECORD ENDPOINTS
// ============================================
export const healthRecordService = {
  getRecords: () => api.get("/health-records"),
  getRecordById: (id: string) => api.get(`/health-records/${id}`),
  createRecord: (data: any) => api.post("/health-records", data),
  deleteRecord: (id: string) => api.delete(`/health-records/${id}`),
};
