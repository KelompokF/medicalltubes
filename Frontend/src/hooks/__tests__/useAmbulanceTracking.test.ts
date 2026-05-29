/**
 * Tests for useAmbulanceTracking Hook
 * ------------------------------------
 * Tests WebSocket connection, real-time updates, and reconnection logic.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAmbulanceTracking } from '../useAmbulanceTracking';
import trackingService from '../../services/trackingService';

// ─── Mock Setup ───────────────────────────────────────────────────

// Mock tracking service
vi.mock('../../services/trackingService', () => ({
  default: {
    getTrackingData: vi.fn(),
    getWebSocketUrl: vi.fn(),
  },
}));

// Mock WebSocket
class MockWebSocket {
  url: string;
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  readyState: number = 0;

  constructor(url: string) {
    this.url = url;
    // Simulate async connection
    setTimeout(() => {
      this.readyState = 1; // OPEN
      if (this.onopen) {
        this.onopen(new Event('open'));
      }
    }, 0);
  }

  send(data: string) {
    // Mock send
  }

  close() {
    this.readyState = 3; // CLOSED
    if (this.onclose) {
      this.onclose(new CloseEvent('close'));
    }
  }

  // Helper to simulate receiving a message
  simulateMessage(data: any) {
    if (this.onmessage) {
      this.onmessage(new MessageEvent('message', { data: JSON.stringify(data) }));
    }
  }

  // Helper to simulate error
  simulateError() {
    if (this.onerror) {
      this.onerror(new Event('error'));
    }
  }
}

// Store WebSocket instances for testing
let mockWebSocketInstances: MockWebSocket[] = [];

// Replace global WebSocket
global.WebSocket = vi.fn((url: string) => {
  const instance = new MockWebSocket(url);
  mockWebSocketInstances.push(instance);
  return instance as any;
}) as any;

// ─── Test Suite ───────────────────────────────────────────────────

describe('useAmbulanceTracking', () => {
  const mockEmergencyId = 'test-emergency-123';
  const mockTrackingData = {
    emergency_request_id: mockEmergencyId,
    status: 'on_my_way',
    patient_location: {
      lat: -6.2000,
      lng: 106.8000,
      address: 'Test Address',
    },
    ambulance: {
      id: 'ambulance-123',
      name: 'Test Ambulance',
      phone: '1234567890',
      vehicle_type: 'Type A',
      current_lat: -6.2100,
      current_lng: 106.8500,
      speed: 60.0,
      heading: 90.0,
      last_update: new Date().toISOString(),
    },
    route: {
      distance_km: 5.2,
      duration_minutes: 8.5,
      coordinates: [[106.8500, -6.2100], [106.8000, -6.2000]],
      eta_minutes: 8,
      estimated_arrival: new Date().toISOString(),
    },
    last_updated: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockWebSocketInstances = [];
    vi.useFakeTimers();
    
    // Setup default mock implementations
    (trackingService.getTrackingData as any).mockResolvedValue(mockTrackingData);
    (trackingService.getWebSocketUrl as any).mockReturnValue('ws://localhost:8000/ws/tracking/test-emergency-123');
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  // ─── Initial Data Fetch Tests ────────────────────────────────────

  it('should fetch initial tracking data on mount', async () => {
    const { result } = renderHook(() => useAmbulanceTracking(mockEmergencyId));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.trackingData).toBeNull();

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(trackingService.getTrackingData).toHaveBeenCalledWith(mockEmergencyId);
    expect(result.current.trackingData).toEqual(mockTrackingData);
    expect(result.current.error).toBeNull();
  });

  it('should handle initial data fetch error', async () => {
    const errorMessage = 'Failed to fetch tracking data';
    (trackingService.getTrackingData as any).mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useAmbulanceTracking(mockEmergencyId));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to load tracking data');
    expect(result.current.trackingData).toBeNull();
  });

  // ─── WebSocket Connection Tests ───────────────────────────────────

  it('should establish WebSocket connection after initial data fetch', async () => {
    const { result } = renderHook(() => useAmbulanceTracking(mockEmergencyId));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Run timers to trigger WebSocket connection
    await vi.runAllTimersAsync();

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });

    expect(trackingService.getWebSocketUrl).toHaveBeenCalledWith(mockEmergencyId);
    expect(mockWebSocketInstances.length).toBe(1);
  });

  it('should handle WebSocket location updates', async () => {
    const { result } = renderHook(() => useAmbulanceTracking(mockEmergencyId));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await vi.runAllTimersAsync();

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });

    // Simulate location update message
    const locationUpdate = {
      type: 'location_update',
      data: {
        ambulance: {
          current_lat: -6.2050,
          current_lng: 106.8450,
          speed: 65.0,
          heading: 95.0,
        },
      },
    };

    mockWebSocketInstances[0].simulateMessage(locationUpdate);

    await waitFor(() => {
      expect(result.current.trackingData?.ambulance?.current_lat).toBe(-6.2050);
      expect(result.current.trackingData?.ambulance?.current_lng).toBe(106.8450);
    });

    expect(result.current.isLocationStale).toBe(false);
  });

  // ─── Reconnection Tests ───────────────────────────────────────────

  it('should reconnect with exponential backoff on disconnect', async () => {
    const { result } = renderHook(() => useAmbulanceTracking(mockEmergencyId));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await vi.runAllTimersAsync();

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });

    const initialWsCount = mockWebSocketInstances.length;

    // Simulate disconnect
    mockWebSocketInstances[0].close();

    await waitFor(() => {
      expect(result.current.isConnected).toBe(false);
    });

    // Advance timers for first reconnect (1 second)
    await vi.advanceTimersByTimeAsync(1000);

    await waitFor(() => {
      expect(mockWebSocketInstances.length).toBe(initialWsCount + 1);
    });
  });

  it('should handle manual reconnect', async () => {
    const { result } = renderHook(() => useAmbulanceTracking(mockEmergencyId));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await vi.runAllTimersAsync();

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });

    const initialWsCount = mockWebSocketInstances.length;

    // Trigger manual reconnect
    result.current.reconnect();

    await vi.runAllTimersAsync();

    await waitFor(() => {
      expect(mockWebSocketInstances.length).toBe(initialWsCount + 1);
    });
  });

  // ─── Stale Location Detection Tests ───────────────────────────────

  it('should detect stale location after 5 minutes', async () => {
    const { result } = renderHook(() => useAmbulanceTracking(mockEmergencyId));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await vi.runAllTimersAsync();

    expect(result.current.isLocationStale).toBe(false);

    // Advance time by 5 minutes + 30 seconds (stale check interval)
    await vi.advanceTimersByTimeAsync(5 * 60 * 1000 + 30000);

    await waitFor(() => {
      expect(result.current.isLocationStale).toBe(true);
    });
  });

  // ─── Error Handling Tests ─────────────────────────────────────────

  it('should handle WebSocket error messages', async () => {
    const { result } = renderHook(() => useAmbulanceTracking(mockEmergencyId));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await vi.runAllTimersAsync();

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });

    // Simulate error message
    const errorMessage = {
      type: 'error',
      message: 'WebSocket error occurred',
    };

    mockWebSocketInstances[0].simulateMessage(errorMessage);

    await waitFor(() => {
      expect(result.current.error).toBe('WebSocket error occurred');
    });
  });

  it('should handle WebSocket connection error', async () => {
    const { result } = renderHook(() => useAmbulanceTracking(mockEmergencyId));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await vi.runAllTimersAsync();

    // Simulate WebSocket error
    mockWebSocketInstances[0].simulateError();

    await waitFor(() => {
      expect(result.current.error).toBe('WebSocket connection error');
    });
  });

  // ─── Cleanup Tests ────────────────────────────────────────────────

  it('should cleanup WebSocket connection on unmount', async () => {
    const { result, unmount } = renderHook(() => useAmbulanceTracking(mockEmergencyId));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await vi.runAllTimersAsync();

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });

    const ws = mockWebSocketInstances[0];
    const closeSpy = vi.spyOn(ws, 'close');

    unmount();

    expect(closeSpy).toHaveBeenCalled();
  });
});
