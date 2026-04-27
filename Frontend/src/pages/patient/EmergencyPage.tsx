import { useState, useEffect, useCallback } from "react";
import { Phone, MapPin, Clock, AlertTriangle, Shield, Heart, Thermometer, Loader2, Navigation, RefreshCw, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { emergencyService, authService } from "@/services/api";

interface AmbulanceService {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  distance_km: number;
  distance_text: string;
  eta_minutes: number;
  eta_text: string;
  phone: string | null;
  status: string;
  source: string;
}

interface UserLocation {
  lat: number;
  lng: number;
  address?: string;
}

export default function EmergencyPage() {
  const [ambulances, setAmbulances] = useState<AmbulanceService[]>([]);
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [isLoadingAmbulances, setIsLoadingAmbulances] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [emergencyStatus, setEmergencyStatus] = useState<{
    id: string;
    status: string;
    message: string;
    ambulance?: AmbulanceService;
  } | null>(null);
  const [radiusKm, setRadiusKm] = useState(50);

  // Get user's GPS location
  const getLocation = useCallback(() => {
    setIsLoadingLocation(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError("Geolocation tidak didukung oleh browser Anda.");
      setIsLoadingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const loc = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setLocation(loc);
        setIsLoadingLocation(false);
        fetchNearbyAmbulances(loc.lat, loc.lng);
      },
      (error) => {
        let msg = "Gagal mendapatkan lokasi.";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            msg = "Akses lokasi ditolak. Silakan izinkan akses lokasi di browser Anda.";
            break;
          case error.POSITION_UNAVAILABLE:
            msg = "Informasi lokasi tidak tersedia.";
            break;
          case error.TIMEOUT:
            msg = "Permintaan lokasi timeout.";
            break;
        }
        setLocationError(msg);
        setIsLoadingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  }, []);

  // Fetch nearby ambulances from backend
  const fetchNearbyAmbulances = async (lat: number, lng: number) => {
    setIsLoadingAmbulances(true);
    try {
      const response = await emergencyService.getNearbyAmbulances(lat, lng);
      const data = response.data;
      setAmbulances(data.ambulances || []);
      if (data.address) {
        setLocation((prev) =>
          prev ? { ...prev, address: data.address } : null
        );
      }
      if (data.ambulances?.length === 0) {
        toast.info("Tidak ada layanan ambulans ditemukan di area ini. Coba perbesar radius pencarian.");
      }
    } catch (error: unknown) {
      console.error("Error fetching ambulances:", error);
      toast.error("Gagal memuat data ambulans. Silakan coba lagi.");
    } finally {
      setIsLoadingAmbulances(false);
    }
  };

  // Send emergency SOS request
  const handleSOS = async () => {
    if (!location) {
      toast.error("Lokasi belum tersedia. Silakan izinkan akses lokasi.");
      return;
    }

    setIsSending(true);
    try {
      const response = await emergencyService.requestEmergency({
        location: { lat: location.lat, lng: location.lng },
        type: "general",
      });
      const data = response.data;
      setEmergencyStatus({
        id: data.id,
        status: data.status,
        message: data.message,
        ambulance: data.ambulance_assigned,
      });
      toast.success("Permintaan darurat terkirim! Bantuan sedang dalam perjalanan.");
    } catch (error: unknown) {
      console.error("SOS Error:", error);
      toast.error("Gagal mengirim permintaan darurat. Silakan coba lagi.");
    } finally {
      setIsSending(false);
    }
  };

  // Call a specific ambulance
  const handleCallAmbulance = async (ambulance: AmbulanceService) => {
    try {
      // If there's a real phone number, try to call it
      if (ambulance.phone) {
        window.open(`tel:${ambulance.phone}`, "_self");
        return;
      }
      // Otherwise use the backend call endpoint
      await emergencyService.callAmbulance(ambulance.id);
      toast.success(`Menghubungi ${ambulance.name}...`);
    } catch (error: unknown) {
      console.error("Call error:", error);
      toast.error("Gagal menghubungi ambulans.");
    }
  };

  // Refresh search with different radius
  const handleRefresh = () => {
    if (location) {
      fetchNearbyAmbulances(location.lat, location.lng);
    } else {
      getLocation();
    }
  };

  const [isLocationAutoShared, setIsLocationAutoShared] = useState<boolean | null>(null);

  useEffect(() => {
    setIsLoadingLocation(true);
    authService.getLocationSetting()
      .then((res) => {
        const isEnabled = res.data.is_location_enabled;
        setIsLocationAutoShared(isEnabled);
        if (isEnabled) {
          getLocation();
        } else {
          setIsLoadingLocation(false);
          setLocationError("Pengaturan Berbagi Lokasi Otomatis sedang nonaktif. Aktifkan di menu Profil atau tekan 'Cari Lokasi' secara manual.");
        }
      })
      .catch((err) => {
        console.error("Failed to get location setting", err);
        // fallback
        getLocation();
      });
  }, [getLocation]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">Emergency Services</h1>
        <p className="text-muted-foreground mt-1">Dapatkan bantuan medis segera</p>
      </div>

      {/* Emergency SOS Button */}
      <div className="flex justify-center">
        <button
          onClick={handleSOS}
          disabled={isSending || !location}
          className="group relative h-40 w-40 rounded-full bg-emergency hover:bg-emergency/90 transition-all duration-300 flex flex-col items-center justify-center shadow-elevated hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {!isSending && (
            <div className="absolute inset-0 rounded-full bg-emergency/30 animate-ping" />
          )}
          {isSending ? (
            <Loader2 className="h-10 w-10 text-emergency-foreground animate-spin relative z-10" />
          ) : (
            <Phone className="h-10 w-10 text-emergency-foreground mb-1 relative z-10" />
          )}
          <span className="text-sm font-bold text-emergency-foreground relative z-10">
            {isSending ? "Mengirim..." : "SOS"}
          </span>
        </button>
      </div>

      {/* Current Location */}
      <Card className="shadow-card">
        <CardContent className="p-5">
          {isLoadingLocation ? (
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary/10 p-3">
                <Loader2 className="h-5 w-5 text-primary animate-spin" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Mencari Lokasi...</p>
                <p className="font-medium text-foreground">Mengakses GPS Anda...</p>
              </div>
            </div>
          ) : locationError ? (
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-destructive/10 p-3">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-destructive font-medium">Lokasi Tidak Tersedia</p>
                <p className="text-sm text-muted-foreground">{locationError}</p>
              </div>
              <Button size="sm" variant="outline" onClick={getLocation}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Coba Lagi
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-success/10 p-3">
                <Navigation className="h-5 w-5 text-success" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  Lokasi Saat Ini
                  {isLocationAutoShared && (
                    <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/20 h-5 px-1.5">Auto-Shared</Badge>
                  )}
                </p>
                <p className="font-medium text-foreground text-sm truncate">
                  {location?.address || `${location?.lat.toFixed(6)}, ${location?.lng.toFixed(6)}`}
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={getLocation}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search Radius Control */}
      {location && (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 flex-1">
            <Search className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Radius:</span>
            <select
              value={radiusKm}
              onChange={(e) => {
                const newRadius = Number(e.target.value);
                setRadiusKm(newRadius);
              }}
              className="text-sm border rounded-md px-2 py-1 bg-background text-foreground"
            >
              <option value={5}>5 km</option>
              <option value={10}>10 km</option>
              <option value={15}>15 km</option>
              <option value={25}>25 km</option>
              <option value={50}>50 km</option>
              <option value={100}>100 km</option>
              <option value={200}>200 km</option>
            </select>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleRefresh}
            disabled={isLoadingAmbulances}
          >
            {isLoadingAmbulances ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-1" />
            )}
            Cari Ulang
          </Button>
        </div>
      )}

      {/* Nearby Ambulances */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          Ambulans & RS Terdekat
          {ambulances.length > 0 && (
            <Badge variant="secondary" className="ml-1">
              {ambulances.length} ditemukan
            </Badge>
          )}
        </h2>

        {isLoadingAmbulances ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 text-primary animate-spin mb-3" />
            <p className="text-muted-foreground text-sm">Mencari layanan ambulans terdekat...</p>
          </div>
        ) : ambulances.length === 0 && location ? (
          <Card className="shadow-card">
            <CardContent className="p-8 text-center">
              <div className="rounded-full bg-muted/50 p-4 inline-block mb-3">
                <Search className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-sm">
                Tidak ada layanan ambulans ditemukan dalam radius {radiusKm} km.
              </p>
              <Button
                size="sm"
                variant="outline"
                className="mt-3"
                onClick={() => {
                  setRadiusKm(50);
                  if (location) fetchNearbyAmbulances(location.lat, location.lng);
                }}
              >
                Perbesar Radius ke 50 km
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ambulances.map((amb) => (
              <Card key={amb.id} className="shadow-card hover:shadow-card-hover transition-all">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-foreground text-sm leading-tight flex-1 mr-2">
                      {amb.name}
                    </h3>
                    <Badge
                      variant="default"
                      className={
                        amb.source.includes("ambulance_station")
                          ? "bg-emergency/10 text-emergency border-emergency/20 shrink-0"
                          : "bg-success/10 text-success border-success/20 shrink-0"
                      }
                    >
                      {amb.source.includes("ambulance_station")
                        ? "Ambulans"
                        : amb.source.includes("hospital")
                        ? "Rumah Sakit"
                        : "Darurat"}
                    </Badge>
                  </div>

                  <div className="space-y-1.5 text-sm text-muted-foreground mb-3">
                    <p className="flex items-start gap-2">
                      <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{amb.address}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Navigation className="h-3.5 w-3.5" />
                      {amb.distance_text}
                    </p>
                    <p className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5" />
                      ETA: {amb.eta_text}
                    </p>
                    {amb.phone && (
                      <p className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5" />
                        {amb.phone}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => handleCallAmbulance(amb)}
                    >
                      <Phone className="h-3.5 w-3.5 mr-1" />
                      Hubungi
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        window.open(
                          `https://www.google.com/maps/dir/?api=1&destination=${amb.lat},${amb.lng}`,
                          "_blank"
                        );
                      }}
                    >
                      <MapPin className="h-3.5 w-3.5 mr-1" />
                      Rute
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Emergency Request Status */}
      <Card className={`shadow-card ${emergencyStatus ? "border-emergency/40" : "border-emergency/20"}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-emergency">
            <AlertTriangle className="h-5 w-5" />
            Status Permintaan Darurat
          </CardTitle>
        </CardHeader>
        <CardContent>
          {emergencyStatus ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge
                  variant="default"
                  className={
                    emergencyStatus.status === "dispatched"
                      ? "bg-success/10 text-success border-success/20"
                      : "bg-warning/10 text-warning border-warning/20"
                  }
                >
                  {emergencyStatus.status === "dispatched" ? "Dikirim" : "Mencari"}
                </Badge>
                <span className="text-sm text-muted-foreground">ID: {emergencyStatus.id.slice(0, 8)}...</span>
              </div>
              <p className="text-sm text-foreground">{emergencyStatus.message}</p>
              {emergencyStatus.ambulance && (
                <div className="bg-muted/50 rounded-lg p-3 text-sm">
                  <p className="font-medium">{emergencyStatus.ambulance.name}</p>
                  <p className="text-muted-foreground">{emergencyStatus.ambulance.distance_text} • ETA: {emergencyStatus.ambulance.eta_text}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              Tidak ada permintaan darurat aktif. Tekan tombol SOS di atas jika Anda butuh bantuan segera.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Emergency Tips */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Tips Darurat
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: Heart, title: "CPR", desc: "Tekan kuat & cepat di tengah dada" },
              { icon: AlertTriangle, title: "Tersedak", desc: "Lakukan dorongan perut (Heimlich)" },
              { icon: Thermometer, title: "Luka Bakar", desc: "Dinginkan di bawah air mengalir selama 10 menit" },
            ].map((tip) => (
              <div key={tip.title} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <tip.icon className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-foreground text-sm">{tip.title}</p>
                  <p className="text-xs text-muted-foreground">{tip.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Emergency Numbers (Indonesia) */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-primary" />
            Nomor Darurat
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { name: "Ambulans", number: "118", color: "bg-emergency/10 text-emergency" },
              { name: "Polisi", number: "110", color: "bg-blue-500/10 text-blue-600" },
              { name: "Pemadam", number: "113", color: "bg-orange-500/10 text-orange-600" },
              { name: "SAR", number: "115", color: "bg-green-500/10 text-green-600" },
            ].map((item) => (
              <a
                key={item.number}
                href={`tel:${item.number}`}
                className={`flex flex-col items-center p-3 rounded-lg ${item.color} hover:opacity-80 transition-opacity`}
              >
                <span className="text-2xl font-bold">{item.number}</span>
                <span className="text-xs font-medium mt-1">{item.name}</span>
              </a>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
