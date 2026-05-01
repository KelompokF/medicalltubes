import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  MapPin,
  Star,
  Filter,
  Navigation,
  Loader2,
  RefreshCw,
  Stethoscope,
  MessageCircle,
  Building2,
  Clock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { doctorService, patientService } from "@/services/api";
import { useQuery } from "@tanstack/react-query";

interface Doctor {
  id: string;
  user_id: string;
  name: string;
  specialization: string;
  hospital_name: string;
  hospital_address: string | null;
  experience_years: number;
  fee: number;
  rating: number;
  total_reviews: number;
  is_available: boolean;
  lat: number | null;
  lng: number | null;
  distance_km: number | null;
  distance_text: string | null;
}

interface UserLocation {
  lat: number;
  lng: number;
}

export default function SearchDoctorPage() {
  const [search, setSearch] = useState("");
  const [specialization, setSpecialization] = useState("All");
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [isLoading, setIsLoading] = useState(true);
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [locationStatus, setLocationStatus] = useState<
    "loading" | "granted" | "denied" | "idle"
  >("idle");
  const [nearbyMode, setNearbyMode] = useState(false);
  const [radiusKm, setRadiusKm] = useState(50);

  // Check location sharing setting
  const { data: locationSetting } = useQuery({
    queryKey: ["locationSharing"],
    queryFn: () => patientService.getLocationSharing().then((r) => r.data),
  });
  const isLocationSharingEnabled = locationSetting?.location_sharing_enabled ?? null;

  // Get user location
  const getLocation = useCallback(() => {
    setLocationStatus("loading");

    if (!navigator.geolocation) {
      setLocationStatus("denied");
      toast.error("Geolocation tidak didukung oleh browser Anda.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const loc = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setLocation(loc);
        setLocationStatus("granted");
        setNearbyMode(true);
      },
      (error) => {
        setLocationStatus("denied");
        if (error.code === error.PERMISSION_DENIED) {
          toast.info(
            "Akses lokasi ditolak. Menampilkan semua dokter tanpa filter jarak."
          );
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 300000 }
    );
  }, []);

  // Fetch doctors from backend
  const fetchDoctors = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: any = {};
      if (search) params.search = search;
      if (specialization && specialization !== "All")
        params.specialization = specialization;
      if (nearbyMode && location) {
        params.lat = location.lat;
        params.lng = location.lng;
        params.radius_km = radiusKm;
      }

      const response = await doctorService.searchDoctors(params);
      const data = response.data;
      setDoctors(data.doctors || []);
      setSpecializations(data.specializations || []);
      setCurrentPage(1); // Reset ke halaman 1 setiap fetch baru
    } catch (error: any) {
      console.error("Error fetching doctors:", error);
      toast.error("Gagal memuat data dokter.");
    } finally {
      setIsLoading(false);
    }
  }, [search, specialization, nearbyMode, location, radiusKm]);

  // Auto-fetch location
  useEffect(() => {
    if (isLocationSharingEnabled === null) return;
    if (isLocationSharingEnabled) {
      getLocation();
    } else {
      setLocationStatus("idle");
    }
  }, [getLocation, isLocationSharingEnabled]);

  // Fetch doctors (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDoctors();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchDoctors]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Logic Pagination
  const totalPages = Math.ceil(doctors.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const filtered = doctors.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Stethoscope className="h-6 w-6 text-primary" />
          Find a Doctor
        </h1>
        <p className="text-muted-foreground mt-1">
          Search and connect with the best healthcare professionals near you.
        </p>
      </div>

      {/* GPS Location Bar */}
      <Card className="shadow-card border-primary/10">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {locationStatus === "loading" ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span>Mencari lokasi GPS...</span>
                </div>
              ) : locationStatus === "granted" ? (
                <div className="flex items-center gap-2 text-sm">
                  <div className="rounded-full bg-success/10 p-1.5">
                    <Navigation className="h-3.5 w-3.5 text-success" />
                  </div>
                  <span className="text-success font-medium">GPS Aktif</span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground truncate">
                    {location
                      ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`
                      : ""}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>Lokasi tidak aktif</span>
                </div>
              )}
            </div>

            {locationStatus === "granted" && (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant={nearbyMode ? "default" : "outline"}
                  onClick={() => setNearbyMode(!nearbyMode)}
                  className="text-xs"
                >
                  <Navigation className="h-3.5 w-3.5 mr-1" />
                  {nearbyMode ? "Nearby: ON" : "Nearby: OFF"}
                </Button>
                {nearbyMode && (
                  <select
                    value={radiusKm}
                    onChange={(e) => setRadiusKm(Number(e.target.value))}
                    className="text-xs border rounded-md px-2 py-1.5 bg-background text-foreground outline-none focus:ring-1 focus:ring-primary"
                  >
                    {[5, 10, 25, 50, 100, 200].map((r) => (
                      <option key={r} value={r}>{r} km</option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {locationStatus === "denied" && (
              <Button size="sm" variant="outline" onClick={getLocation}>
                <RefreshCw className="h-3.5 w-3.5 mr-1" />
                Aktifkan GPS
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama dokter..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-10"
          />
        </div>
        <Select
          value={specialization}
          onValueChange={(val) => {
            setSpecialization(val);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-56">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">Semua Spesialisasi</SelectItem>
            {specializations.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Results Header */}
      {!isLoading && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {doctors.length} dokter ditemukan
            {nearbyMode && location ? ` dalam radius ${radiusKm} km` : ""}
          </p>
          <Button
            size="sm"
            variant="ghost"
            onClick={fetchDoctors}
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-3.5 w-3.5 mr-1 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="h-8 w-8 text-primary animate-spin mb-3" />
          <p className="text-muted-foreground text-sm">Memuat data dokter...</p>
        </div>
      )}

      {/* Doctor Cards */}
      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((doctor) => (
            <Card
              key={doctor.id}
              className="shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-0.5"
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="h-14 w-14 rounded-full medical-gradient flex items-center justify-center text-primary-foreground font-bold text-lg shrink-0">
                    {doctor.name
                      .split(" ")
                      .filter((n) => n.length > 1 && !n.includes(".") && !n.includes(","))
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-foreground truncate">
                          {doctor.name}
                        </h3>
                        <p className="text-sm text-primary font-medium">
                          {doctor.specialization}
                        </p>
                      </div>
                      <Badge
                        variant={doctor.is_available ? "default" : "secondary"}
                        className={doctor.is_available ? "bg-success/10 text-success border-success/20" : ""}
                      >
                        {doctor.is_available ? "Available" : "Offline"}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-1.5 mt-2 text-sm text-muted-foreground">
                      <Building2 className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{doctor.hospital_name}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 text-warning fill-warning" />
                        {doctor.rating} ({doctor.total_reviews})
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {doctor.experience_years} thn
                      </span>
                      {doctor.distance_text && (
                        <span className="flex items-center gap-1 text-primary font-medium">
                          <Navigation className="h-3.5 w-3.5" />
                          {doctor.distance_text}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-3">
                      <span className="text-sm font-semibold text-foreground">
                        {formatCurrency(doctor.fee)}
                      </span>
                      <span className="text-xs text-muted-foreground">/ konsultasi</span>
                    </div>

                    <div className="flex gap-2 mt-3">
                      <Button size="sm" variant="outline" asChild>
                        <Link to={`/doctor/${doctor.user_id}`}>Detail</Link>
                      </Button>
                      {doctor.is_available && (
                        <Button size="sm" asChild>
                          <Link
                            to={`/chat?doctor_id=${doctor.user_id}&doctor_name=${encodeURIComponent(doctor.name)}`}
                          >
                            <MessageCircle className="h-3.5 w-3.5 mr-1" />
                            Chat
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && doctors.length === 0 && (
        <div className="text-center py-12">
          <div className="rounded-full bg-muted/50 p-4 inline-block mb-3">
            <Search className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">
            Tidak ada dokter ditemukan sesuai kriteria pencarian.
          </p>
          {nearbyMode && (
            <Button
              size="sm"
              variant="outline"
              className="mt-3"
              onClick={() => {
                setRadiusKm(200);
                setNearbyMode(true);
              }}
            >
              Perbesar Radius
            </Button>
          )}
        </div>
      )}

      {/* Pagination Controls */}
      {!isLoading && doctors.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-muted mt-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Tampilkan</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="h-8 rounded-md border border-input bg-background px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-primary"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <span>per halaman</span>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Prev
            </Button>

            <div className="text-sm font-medium">
              Halaman {currentPage} dari {totalPages || 1}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}