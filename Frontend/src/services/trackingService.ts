import api from "./api";

// ============================================
// TYPE DEFINITIONS
// ============================================

/**
 * Location coordinates
 */
export interface Location {
  lat: number;
  lng: number;
}

/**
 * Patient location information
 */
export interface PatientLocation {
  lat: number;
  lng: number;
  address?: string;
}

/**
 * Route information between ambulance and patient
 */
export interface RouteInfo {
  distance_km: number;
  duration_minutes: number;
  coordinates: [number, number][]; // Array of [lng, lat] pairs for route polyline
  eta_minutes: number;
  estimated_arrival: string;
}

/**
 * Ambulance information
 */
export interface AmbulanceInfo {
  id: string;
  name: string;
  phone?: string;
  vehicle_type?: string;
  current_lat: number;
  current_lng: number;
  speed?: number;
  heading?: number;
  last_update: string;
}

/**
 * Patient information (legacy - for backward compatibility)
 */
export interface PatientInfo {
  id: string;
  name: string;
  phone_number: string;
  location: Location;
}

/**
 * Complete tracking data for an emergency request
 */
export interface TrackingData {
  emergency_request_id: string;
  status: "pending" | "dispatched" | "on_my_way" | "on_progress" | "completed" | "cancelled";
  patient_location: PatientLocation;
  ambulance: AmbulanceInfo | null;
  route: RouteInfo | null;
  last_updated: string;
  // Legacy fields for backward compatibility
  patient?: PatientInfo;
  estimated_arrival_time?: string;
  distance_km?: number;
  created_at?: string;
  updated_at?: string;
}

/**
 * Location update payload
 */
export interface LocationUpdate {
  emergency_request_id: string;
  location: Location;
  timestamp?: string;
}

/**
 * Location update response
 */
export interface LocationUpdateResponse {
  success: boolean;
  message: string;
  updated_at: string;
}

// ============================================
// TRACKING SERVICE
// ============================================

/**
 * Service for ambulance live tracking operations
 */
class TrackingService {
  /**
   * Get real-time tracking data for an emergency request
   * @param emergencyRequestId - The ID of the emergency request to track
   * @returns Promise with tracking data including ambulance and patient locations
   */
  async getTrackingData(emergencyRequestId: string): Promise<TrackingData> {
    const response = await api.get<TrackingData>(
      `/api/tracking/emergencies/${emergencyRequestId}`
    );
    return response.data;
  }

  /**
   * Update ambulance location for an emergency request
   * @param data - Location update data including emergency request ID and new coordinates
   * @returns Promise with update confirmation
   */
  async updateLocation(data: LocationUpdate): Promise<LocationUpdateResponse> {
    const payload = {
      ...data,
      timestamp: data.timestamp || new Date().toISOString(),
    };
    
    const response = await api.patch<LocationUpdateResponse>(
      `/api/tracking/ambulances/location`,
      payload
    );
    return response.data;
  }

  /**
   * Get location history for an emergency request
   * @param emergencyRequestId - The ID of the emergency request
   * @param limit - Maximum number of location points to retrieve (default: 50)
   * @returns Promise with array of historical location points
   */
  async getLocationHistory(
    emergencyRequestId: string,
    limit: number = 50
  ): Promise<Array<{ location: Location; timestamp: string }>> {
    const response = await api.get(
      `/tracking/${emergencyRequestId}/history`,
      { params: { limit } }
    );
    return response.data;
  }

  /**
   * Subscribe to real-time location updates via WebSocket
   * Note: This method returns the WebSocket URL for connection
   * @param emergencyRequestId - The ID of the emergency request
   * @returns WebSocket URL for real-time updates
   */
  getWebSocketUrl(emergencyRequestId: string): string {
    const wsBaseUrl = import.meta.env.VITE_WS_BASE_URL || "ws://localhost:8001";
    const token = localStorage.getItem("access_token");
    return `${wsBaseUrl}/ws/tracking/${emergencyRequestId}?token=${token}`;
  }
}

// ============================================
// SINGLETON EXPORT
// ============================================

/**
 * Singleton instance of TrackingService
 * Use this instance throughout the application for tracking operations
 */
const trackingService = new TrackingService();

export default trackingService;
