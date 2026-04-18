export const doctors = [
  { id: "1", name: "Dr. Sarah Johnson", specialization: "Cardiologist", experience: 12, rating: 4.9, location: "New York, NY", status: "available" as const, fee: 150, avatar: "", about: "Board-certified cardiologist with over 12 years of experience in interventional cardiology and heart failure management.", reviews: 245 },
  { id: "2", name: "Dr. Michael Chen", specialization: "Neurologist", experience: 8, rating: 4.7, location: "Los Angeles, CA", status: "available" as const, fee: 180, avatar: "", about: "Specializing in neurodegenerative diseases and stroke management with cutting-edge treatment approaches.", reviews: 189 },
  { id: "3", name: "Dr. Emily Davis", specialization: "Dermatologist", experience: 15, rating: 4.8, location: "Chicago, IL", status: "offline" as const, fee: 120, avatar: "", about: "Expert in cosmetic and medical dermatology with a focus on skin cancer detection and treatment.", reviews: 312 },
  { id: "4", name: "Dr. James Wilson", specialization: "Orthopedic Surgeon", experience: 20, rating: 4.9, location: "Houston, TX", status: "available" as const, fee: 200, avatar: "", about: "Leading orthopedic surgeon specializing in joint replacement and sports medicine.", reviews: 420 },
  { id: "5", name: "Dr. Lisa Park", specialization: "Pediatrician", experience: 10, rating: 4.6, location: "Phoenix, AZ", status: "available" as const, fee: 100, avatar: "", about: "Compassionate pediatrician dedicated to children's health from newborn through adolescence.", reviews: 156 },
  { id: "6", name: "Dr. Robert Martinez", specialization: "General Practitioner", experience: 18, rating: 4.5, location: "San Diego, CA", status: "offline" as const, fee: 90, avatar: "", about: "Experienced GP providing comprehensive primary care for adults and families.", reviews: 278 },
];

export const specializations = ["All", "Cardiologist", "Neurologist", "Dermatologist", "Orthopedic Surgeon", "Pediatrician", "General Practitioner"];
export const locations = ["All", "New York, NY", "Los Angeles, CA", "Chicago, IL", "Houston, TX", "Phoenix, AZ", "San Diego, CA"];

export const patientStats = {
  totalConsultations: 24,
  homeVisitBookings: 5,
  emergencyRequests: 2,
  activePrescriptions: 8,
};

export const recentActivities = [
  { id: 1, type: "consultation", description: "Consultation with Dr. Sarah Johnson", date: "2026-04-13", status: "completed" },
  { id: 2, type: "prescription", description: "Prescription updated by Dr. Chen", date: "2026-04-12", status: "active" },
  { id: 3, type: "homevisit", description: "Home visit scheduled with Dr. Davis", date: "2026-04-15", status: "upcoming" },
  { id: 4, type: "emergency", description: "Emergency request resolved", date: "2026-04-10", status: "completed" },
];

export const upcomingAppointment = {
  doctor: "Dr. Sarah Johnson",
  specialization: "Cardiologist",
  date: "April 16, 2026",
  time: "10:00 AM",
  type: "Video Consultation",
};

export const chatConversations = [
  { id: 1, doctorName: "Dr. Sarah Johnson", lastMessage: "Take the medication twice daily after meals.", timestamp: "10:30 AM", unread: 2, avatar: "" },
  { id: 2, doctorName: "Dr. Michael Chen", lastMessage: "Your test results look normal.", timestamp: "Yesterday", unread: 0, avatar: "" },
  { id: 3, doctorName: "Dr. Emily Davis", lastMessage: "Please schedule a follow-up visit.", timestamp: "Apr 11", unread: 1, avatar: "" },
];

export const chatMessages = [
  { id: 1, sender: "doctor", message: "Hello! How are you feeling today?", timestamp: "10:00 AM" },
  { id: 2, sender: "user", message: "Hi doctor, I've been having headaches for the past few days.", timestamp: "10:02 AM" },
  { id: 3, sender: "doctor", message: "I see. Can you describe the intensity and location of the headaches?", timestamp: "10:03 AM" },
  { id: 4, sender: "user", message: "It's mostly on the right side, moderate intensity. Usually worse in the morning.", timestamp: "10:05 AM" },
  { id: 5, sender: "doctor", message: "Have you been getting enough sleep? Any recent stress or changes in your routine?", timestamp: "10:06 AM" },
  { id: 6, sender: "user", message: "Actually, I've been working late nights this week. Probably not sleeping well.", timestamp: "10:08 AM" },
  { id: 7, sender: "doctor", message: "That could be a major contributor. I'd recommend getting at least 7-8 hours of sleep. I'll also prescribe a mild pain reliever.", timestamp: "10:10 AM" },
  { id: 8, sender: "doctor", message: "Take the medication twice daily after meals.", timestamp: "10:30 AM" },
];

export const timeSlots = ["09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM", "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM", "04:00 PM"];

export const ambulances = [
  { id: 1, name: "City Ambulance Unit 1", distance: "1.2 km", eta: "4 min", status: "available" },
  { id: 2, name: "Metro Emergency Service", distance: "2.5 km", eta: "7 min", status: "available" },
  { id: 3, name: "Rapid Response Unit 3", distance: "3.8 km", eta: "10 min", status: "busy" },
];

export const adminStats = {
  totalUsers: 12450,
  totalDoctors: 342,
  activeEmergencies: 8,
  totalConsultations: 45230,
};

export const adminUsers = [
  { id: 1, name: "John Smith", email: "john@email.com", role: "Patient", status: "Active", joined: "2026-01-15" },
  { id: 2, name: "Jane Doe", email: "jane@email.com", role: "Patient", status: "Active", joined: "2026-02-20" },
  { id: 3, name: "Dr. Sarah Johnson", email: "sarah@email.com", role: "Doctor", status: "Active", joined: "2025-06-10" },
  { id: 4, name: "Mike Brown", email: "mike@email.com", role: "Patient", status: "Inactive", joined: "2025-11-05" },
  { id: 5, name: "Dr. Chen", email: "chen@email.com", role: "Doctor", status: "Active", joined: "2025-08-22" },
];

export const doctorDashboardStats = {
  patientsToday: 12,
  pendingConsultations: 5,
  upcomingHomeVisits: 3,
  newNotifications: 8,
};

export const patientRequests = [
  { id: 1, patient: "John Smith", type: "Consultation", time: "10:00 AM", status: "Pending", symptoms: "Headache, fever" },
  { id: 2, patient: "Jane Doe", type: "Home Visit", time: "11:30 AM", status: "Confirmed", symptoms: "Back pain" },
  { id: 3, patient: "Mike Brown", type: "Follow-up", time: "02:00 PM", status: "Pending", symptoms: "Checkup" },
];

export const emergencyRequests = [
  { id: 1, patient: "Alice Johnson", location: "123 Main St, NY", type: "Cardiac Emergency", time: "2 min ago", priority: "Critical" },
  { id: 2, patient: "Bob Williams", location: "456 Oak Ave, NY", type: "Accident", time: "5 min ago", priority: "High" },
  { id: 3, patient: "Carol Davis", location: "789 Pine Rd, NY", type: "Breathing Difficulty", time: "8 min ago", priority: "Medium" },
];

export const doctorSchedule = [
  { date: "2026-04-14", slots: ["09:00 AM", "10:00 AM", "11:00 AM", "02:00 PM", "03:00 PM"] },
  { date: "2026-04-15", slots: ["09:30 AM", "10:30 AM", "11:30 AM", "02:30 PM"] },
  { date: "2026-04-16", slots: ["09:00 AM", "10:00 AM", "03:00 PM", "04:00 PM"] },
];

export const doctorReviews = [
  { id: 1, patient: "John S.", rating: 5, comment: "Excellent doctor! Very thorough and caring.", date: "2026-04-01" },
  { id: 2, patient: "Maria L.", rating: 4, comment: "Great experience. Explained everything clearly.", date: "2026-03-28" },
  { id: 3, patient: "David R.", rating: 5, comment: "Highly recommend. Very professional.", date: "2026-03-20" },
];

export const analyticsData = [
  { month: "Jan", consultations: 320, homeVisits: 45, emergencies: 12 },
  { month: "Feb", consultations: 380, homeVisits: 52, emergencies: 8 },
  { month: "Mar", consultations: 420, homeVisits: 61, emergencies: 15 },
  { month: "Apr", consultations: 390, homeVisits: 48, emergencies: 10 },
  { month: "May", consultations: 450, homeVisits: 55, emergencies: 7 },
  { month: "Jun", consultations: 480, homeVisits: 63, emergencies: 11 },
];
