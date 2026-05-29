import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Location {
  latitude: number;
  longitude: number;
}

interface TrackingMapProps {
  patientLocation: Location;
  ambulanceLocation: Location;
  ambulanceHeading?: number;
  route?: Location[];
  className?: string;
}

// Custom marker icons
const createPatientIcon = () => {
  return L.divIcon({
    className: "custom-marker",
    html: `
      <div style="
        width: 32px;
        height: 32px;
        background-color: #ef4444;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

const createAmbulanceIcon = (heading: number = 0) => {
  return L.divIcon({
    className: "custom-marker",
    html: `
      <div style="
        width: 40px;
        height: 40px;
        background-color: #3b82f6;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        transform: rotate(${heading}deg);
      ">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
          <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
        </svg>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};

const TrackingMap = ({
  patientLocation,
  ambulanceLocation,
  ambulanceHeading = 0,
  route = [],
  className = "",
}: TrackingMapProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const patientMarkerRef = useRef<L.Marker | null>(null);
  const ambulanceMarkerRef = useRef<L.Marker | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [patientLocation.latitude, patientLocation.longitude],
      zoom: 13,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update patient marker
  useEffect(() => {
    if (!mapRef.current) return;

    if (patientMarkerRef.current) {
      patientMarkerRef.current.setLatLng([patientLocation.latitude, patientLocation.longitude]);
    } else {
      patientMarkerRef.current = L.marker(
        [patientLocation.latitude, patientLocation.longitude],
        { icon: createPatientIcon() }
      )
        .addTo(mapRef.current)
        .bindPopup("Patient Location");
    }
  }, [patientLocation]);

  // Update ambulance marker
  useEffect(() => {
    if (!mapRef.current) return;

    if (ambulanceMarkerRef.current) {
      ambulanceMarkerRef.current.setLatLng([ambulanceLocation.latitude, ambulanceLocation.longitude]);
      ambulanceMarkerRef.current.setIcon(createAmbulanceIcon(ambulanceHeading));
    } else {
      ambulanceMarkerRef.current = L.marker(
        [ambulanceLocation.latitude, ambulanceLocation.longitude],
        { icon: createAmbulanceIcon(ambulanceHeading) }
      )
        .addTo(mapRef.current)
        .bindPopup("Ambulance Location");
    }
  }, [ambulanceLocation, ambulanceHeading]);

  // Update route polyline
  useEffect(() => {
    if (!mapRef.current) return;

    if (routePolylineRef.current) {
      mapRef.current.removeLayer(routePolylineRef.current);
    }

    if (route.length > 0) {
      const latLngs = route.map((loc) => [loc.latitude, loc.longitude] as [number, number]);
      routePolylineRef.current = L.polyline(latLngs, {
        color: "#3b82f6",
        weight: 4,
        opacity: 0.7,
        dashArray: "10, 10",
      }).addTo(mapRef.current);
    }
  }, [route]);

  // Auto-center on markers
  useEffect(() => {
    if (!mapRef.current) return;

    const bounds = L.latLngBounds([
      [patientLocation.latitude, patientLocation.longitude],
      [ambulanceLocation.latitude, ambulanceLocation.longitude],
    ]);

    mapRef.current.fitBounds(bounds, { padding: [50, 50] });
  }, [patientLocation, ambulanceLocation]);

  return (
    <div
      ref={containerRef}
      className={`w-full h-full min-h-[400px] rounded-lg overflow-hidden ${className}`}
      style={{ zIndex: 0 }}
    />
  );
};

export default TrackingMap;
