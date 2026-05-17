import { useState, useEffect, useRef, useCallback } from 'react';
import trackingService, { TrackingData } from '../services/trackingService';

// ============================================
// TYPE DEFINITIONS
// ============================================

/**
 * Return type for useAmbulanceTracking hook
 */
export interface UseAmbulanceTrackingReturn {
  trackingData: TrackingData | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  isLocationStale: boolean;
  reconnect: () => void;
}

/**
 * WebSocket message types
 */
interface WebSocketMessage {
  type: 'location_update' | 'status_update' | 'error';
  data?: Partial<TrackingData>;
  message?: string;
}

// ============================================
// CONSTANTS
// ============================================

const INITIAL_RECONNECT_DELAY = 1000; // 1 second
const MAX_RECONNECT_DELAY = 30000; // 30 seconds
const STALE_LOCATION_THRESHOLD = 5 * 60 * 1000; // 5 minutes in milliseconds

// ============================================
// HOOK IMPLEMENTATION
// ============================================

/**
 * Custom hook for managing ambulance tracking WebSocket connection
 * 
 * Features:
 * - Fetches initial tracking data via REST API
 * - Establishes WebSocket connection for real-time updates
 * - Handles automatic reconnection with exponential backoff
 * - Detects stale locations (>5 minutes since last update)
 * - Provides manual reconnect capability
 * - Cleans up connections on unmount
 * 
 * @param emergencyRequestId - The ID of the emergency request to track
 * @returns Object containing tracking data, connection state, and control functions
 */
export function useAmbulanceTracking(
  emergencyRequestId: string
): UseAmbulanceTrackingReturn {
  // ============================================
  // STATE MANAGEMENT
  // ============================================

  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLocationStale, setIsLocationStale] = useState(false);

  // ============================================
  // REFS FOR WEBSOCKET MANAGEMENT
  // ============================================

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectDelayRef = useRef(INITIAL_RECONNECT_DELAY);
  const isManualDisconnectRef = useRef(false);
  const lastUpdateTimeRef = useRef<number>(Date.now());
  const staleCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // ============================================
  // STALE LOCATION DETECTION
  // ============================================

  /**
   * Check if the location data is stale (>5 minutes old)
   */
  const checkLocationStaleness = useCallback(() => {
    if (!trackingData?.ambulance?.current_location) {
      setIsLocationStale(false);
      return;
    }

    const timeSinceLastUpdate = Date.now() - lastUpdateTimeRef.current;
    setIsLocationStale(timeSinceLastUpdate > STALE_LOCATION_THRESHOLD);
  }, [trackingData]);

  // ============================================
  // WEBSOCKET CONNECTION MANAGEMENT
  // ============================================

  /**
   * Connect to WebSocket server
   */
  const connectWebSocket = useCallback(() => {
    // Clean up existing connection
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    try {
      const wsUrl = trackingService.getWebSocketUrl(emergencyRequestId);
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setError(null);
        reconnectDelayRef.current = INITIAL_RECONNECT_DELAY; // Reset backoff
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);

          if (message.type === 'error') {
            setError(message.message || 'WebSocket error occurred');
            return;
          }

          if (message.type === 'location_update' || message.type === 'status_update') {
            if (message.data) {
              setTrackingData((prev) => {
                if (!prev) return prev;
                return {
                  ...prev,
                  ...message.data,
                  updated_at: new Date().toISOString(),
                };
              });
              lastUpdateTimeRef.current = Date.now();
              setIsLocationStale(false);
            }
          }
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
          setError('Failed to parse server message');
        }
      };

      ws.onerror = (event) => {
        console.error('WebSocket error:', event);
        setError('WebSocket connection error');
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);

        // Attempt reconnection if not manually disconnected
        if (!isManualDisconnectRef.current) {
          const delay = reconnectDelayRef.current;
          console.log(`Reconnecting in ${delay}ms...`);

          reconnectTimeoutRef.current = setTimeout(() => {
            // Exponential backoff with max limit
            reconnectDelayRef.current = Math.min(
              reconnectDelayRef.current * 2,
              MAX_RECONNECT_DELAY
            );
            connectWebSocket();
          }, delay);
        }
      };

      wsRef.current = ws;
    } catch (err) {
      console.error('Failed to create WebSocket connection:', err);
      setError('Failed to establish WebSocket connection');
      setIsConnected(false);
    }
  }, [emergencyRequestId]);

  /**
   * Manual reconnect function
   */
  const reconnect = useCallback(() => {
    console.log('Manual reconnect triggered');
    reconnectDelayRef.current = INITIAL_RECONNECT_DELAY;
    connectWebSocket();
  }, [connectWebSocket]);

  // ============================================
  // INITIAL DATA FETCH
  // ============================================

  /**
   * Fetch initial tracking data via REST API
   */
  const fetchInitialData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await trackingService.getTrackingData(emergencyRequestId);
      setTrackingData(data);
      lastUpdateTimeRef.current = Date.now();
      setError(null);
    } catch (err) {
      console.error('Failed to fetch initial tracking data:', err);
      setError('Failed to load tracking data');
    } finally {
      setIsLoading(false);
    }
  }, [emergencyRequestId]);

  // ============================================
  // LIFECYCLE EFFECTS
  // ============================================

  /**
   * Initialize: Fetch initial data and establish WebSocket connection
   */
  useEffect(() => {
    isManualDisconnectRef.current = false;

    // Fetch initial data first
    fetchInitialData().then(() => {
      // Then establish WebSocket connection
      connectWebSocket();
    });

    // Start stale location check interval
    staleCheckIntervalRef.current = setInterval(checkLocationStaleness, 30000); // Check every 30 seconds

    // Cleanup on unmount
    return () => {
      isManualDisconnectRef.current = true;

      // Clear reconnect timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      // Clear stale check interval
      if (staleCheckIntervalRef.current) {
        clearInterval(staleCheckIntervalRef.current);
        staleCheckIntervalRef.current = null;
      }

      // Close WebSocket connection
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [emergencyRequestId, fetchInitialData, connectWebSocket, checkLocationStaleness]);

  // ============================================
  // RETURN HOOK INTERFACE
  // ============================================

  return {
    trackingData,
    isConnected,
    isLoading,
    error,
    isLocationStale,
    reconnect,
  };
}

export default useAmbulanceTracking;
