import { useParams, useNavigate } from "react-router-dom";
import { useAmbulanceTracking } from "../hooks/useAmbulanceTracking";
import TrackingMap from "../components/tracking/TrackingMap";

/**
 * AmbulanceTrackingPage Component
 * 
 * Real-time ambulance tracking page for patients to monitor
 * their emergency request and ambulance location.
 * 
 * Features:
 * - Live map showing patient and ambulance locations
 * - Real-time ETA and distance updates
 * - Ambulance details (driver, vehicle, contact)
 * - Connection status indicators
 * - Stale location warnings
 * - Manual reconnect capability
 * - Emergency call button
 */
const AmbulanceTrackingPage = () => {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();

  // Validate request ID
  if (!requestId) {
    navigate("/patient/dashboard");
    return null;
  }

  // Use tracking hook for real-time updates
  const {
    trackingData,
    isConnected,
    isLoading,
    error,
    isLocationStale,
    reconnect,
  } = useAmbulanceTracking(requestId);

  // ============================================
  // LOADING STATE
  // ============================================

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading tracking data...</p>
        </div>
      </div>
    );
  }

  // ============================================
  // ERROR STATE
  // ============================================

  if (error || !trackingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Unable to Load Tracking
            </h2>
            <p className="text-gray-600 mb-6">
              {error || "Failed to load tracking data. Please try again."}
            </p>
            <div className="space-y-3">
              <button
                onClick={reconnect}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Retry Connection
              </button>
              <button
                onClick={() => navigate("/patient/dashboard")}
                className="w-full bg-gray-200 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // HELPER FUNCTIONS
  // ============================================

  const formatETA = (eta?: string) => {
    if (!eta) return "Calculating...";
    const etaDate = new Date(eta);
    const now = new Date();
    const diffMs = etaDate.getTime() - now.getTime();
    const diffMins = Math.round(diffMs / 60000);
    
    if (diffMins < 1) return "Arriving soon";
    if (diffMins === 1) return "1 minute";
    return `${diffMins} minutes`;
  };

  const formatDistance = (distance?: number) => {
    if (!distance) return "Calculating...";
    return `${distance.toFixed(1)} km`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "on_my_way":
        return "bg-blue-100 text-blue-800";
      case "on_progress":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "on_my_way":
        return "On the way";
      case "on_progress":
        return "In progress";
      case "completed":
        return "Completed";
      case "cancelled":
        return "Cancelled";
      default:
        return "Pending";
    }
  };

  const handleCallAmbulance = () => {
    if (trackingData.ambulance?.phone_number) {
      window.location.href = `tel:${trackingData.ambulance.phone_number}`;
    }
  };

  // ============================================
  // MAIN RENDER
  // ============================================

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-4 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate("/patient/dashboard")}
              className="text-gray-600 hover:text-gray-900"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-gray-900">
              Ambulance Tracking
            </h1>
          </div>

          {/* Connection Status */}
          <div className="flex items-center space-x-2">
            <div
              className={`w-2 h-2 rounded-full ${
                isConnected ? "bg-green-500" : "bg-red-500"
              }`}
            ></div>
            <span className="text-sm text-gray-600">
              {isConnected ? "Connected" : "Disconnected"}
            </span>
          </div>
        </div>
      </div>

      {/* Stale Location Warning */}
      {isLocationStale && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <svg
                className="w-5 h-5 text-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <span className="text-sm text-yellow-800">
                Location data may be outdated. Last update was more than 5 minutes ago.
              </span>
            </div>
            <button
              onClick={reconnect}
              className="text-sm text-yellow-800 hover:text-yellow-900 font-medium underline"
            >
              Reconnect
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Map Section (60-70% height on mobile, 70% width on desktop) */}
        <div className="h-[65vh] lg:h-auto lg:flex-[7]">
          <TrackingMap
            patientLocation={{
              latitude: trackingData.patient.location.lat,
              longitude: trackingData.patient.location.lng,
            }}
            ambulanceLocation={{
              latitude: trackingData.ambulance?.current_location.lat || trackingData.patient.location.lat,
              longitude: trackingData.ambulance?.current_location.lng || trackingData.patient.location.lng,
            }}
            className="h-full"
          />
        </div>

        {/* Info Panel (30-40% height on mobile, 30% width on desktop) */}
        <div className="flex-1 lg:flex-[3] bg-white border-t lg:border-t-0 lg:border-l border-gray-200 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Status Badge */}
            <div>
              <span
                className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                  trackingData.status
                )}`}
              >
                {getStatusText(trackingData.status)}
              </span>
            </div>

            {/* ETA and Distance */}
            <div className="space-y-3">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-sm text-blue-600 font-medium mb-1">
                  Estimated Arrival
                </div>
                <div className="text-2xl font-bold text-blue-900">
                  {formatETA(trackingData.estimated_arrival_time)}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 font-medium mb-1">
                  Distance
                </div>
                <div className="text-xl font-bold text-gray-900">
                  {formatDistance(trackingData.distance_km)}
                </div>
              </div>
            </div>

            {/* Ambulance Details */}
            {trackingData.ambulance && (
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Ambulance Details
                </h3>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-gray-600">Driver</div>
                    <div className="text-base font-medium text-gray-900">
                      {trackingData.ambulance.driver_name}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Vehicle Number</div>
                    <div className="text-base font-medium text-gray-900">
                      {trackingData.ambulance.vehicle_number}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Contact</div>
                    <div className="text-base font-medium text-gray-900">
                      {trackingData.ambulance.phone_number}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="border-t border-gray-200 pt-6 space-y-3">
              {trackingData.ambulance && (
                <button
                  onClick={handleCallAmbulance}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center space-x-2"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  <span>Call Ambulance</span>
                </button>
              )}

              {!isConnected && (
                <button
                  onClick={reconnect}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center space-x-2"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  <span>Reconnect</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AmbulanceTrackingPage;
