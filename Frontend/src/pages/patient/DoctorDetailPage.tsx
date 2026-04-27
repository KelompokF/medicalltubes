import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Star,
  MapPin,
  Clock,
  ArrowLeft,
  MessageCircle,
  Phone,
  Building2,
  Loader2,
  User,
  Stethoscope,
  DollarSign,
  Users,
  Navigation,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { doctorService } from "@/services/api";

interface DoctorDetail {
  id: string;
  user_id: string;
  name: string;
  specialization: string;
  hospital_name: string;
  hospital_address: string | null;
  about: string | null;
  experience_years: number;
  fee: number;
  phone: string | null;
  rating: number;
  total_reviews: number;
  total_patients: number;
  is_available: boolean;
  lat: number | null;
  lng: number | null;
}

export default function DoctorDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState<DoctorDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDoctor = async () => {
      if (!id) return;
      setIsLoading(true);
      setError(null);
      try {
        const response = await doctorService.getDoctorById(id);
        setDoctor(response.data);
      } catch (err: any) {
        console.error("Error fetching doctor:", err);
        setError("Dokter tidak ditemukan.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchDoctor();
  }, [id]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleStartChat = () => {
    if (!doctor) return;
    navigate(
      `/chat?doctor_id=${doctor.user_id}&doctor_name=${encodeURIComponent(doctor.name)}`
    );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
        <Loader2 className="h-8 w-8 text-primary animate-spin mb-3" />
        <p className="text-muted-foreground">Memuat data dokter...</p>
      </div>
    );
  }

  if (error || !doctor) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
        <div className="rounded-full bg-muted/50 p-6 mb-4">
          <User className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground mb-4">
          {error || "Dokter tidak ditemukan."}
        </p>
        <Button variant="outline" asChild>
          <Link to="/search-doctor">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali ke Pencarian
          </Link>
        </Button>
      </div>
    );
  }

  const initials = doctor.name
    .split(" ")
    .filter((n) => n.length > 1 && !n.includes(".") && !n.includes(","))
    .map((n) => n[0])
    .join("")
    .slice(0, 2);

  return (
    <div className="space-y-6 animate-fade-in">
      <Button variant="ghost" size="sm" asChild>
        <Link to="/search-doctor">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali
        </Link>
      </Button>

      {/* Header Card */}
      <Card className="shadow-card overflow-hidden">
        <div className="h-28 medical-gradient relative">
          <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-transparent" />
        </div>
        <CardContent className="relative pt-0 pb-6 px-6">
          <div className="flex flex-col sm:flex-row items-start gap-4 -mt-12">
            <div className="h-24 w-24 rounded-full bg-card border-4 border-card medical-gradient flex items-center justify-center text-primary-foreground font-bold text-2xl shrink-0 shadow-elevated">
              {initials}
            </div>
            <div className="flex-1 mt-2 sm:mt-0">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h1 className="text-xl font-bold text-foreground">
                    {doctor.name}
                  </h1>
                  <p className="text-primary font-medium">
                    {doctor.specialization}
                  </p>
                </div>
                <Badge
                  variant={doctor.is_available ? "default" : "secondary"}
                  className={
                    doctor.is_available
                      ? "bg-success/10 text-success border-success/20"
                      : ""
                  }
                >
                  {doctor.is_available ? "Available" : "Offline"}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-warning fill-warning" />
                  {doctor.rating} ({doctor.total_reviews} reviews)
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {doctor.experience_years} tahun pengalaman
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {doctor.total_patients} pasien
                </span>
              </div>
              <div className="flex gap-2 mt-4">
                {doctor.is_available && (
                  <Button onClick={handleStartChat}>
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Mulai Konsultasi
                  </Button>
                )}
                <Button variant="outline" asChild>
                  <Link to="/home-visit">
                    <Calendar className="h-4 w-4 mr-2" />
                    Kunjungan Rumah
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* About */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-primary" />
                Tentang Dokter
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                {doctor.about || "Informasi dokter belum tersedia."}
              </p>
            </CardContent>
          </Card>

          {/* Hospital Info */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Rumah Sakit / Klinik
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="font-semibold text-foreground">
                  {doctor.hospital_name}
                </p>
                {doctor.hospital_address && (
                  <p className="text-sm text-muted-foreground mt-1 flex items-start gap-2">
                    <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                    {doctor.hospital_address}
                  </p>
                )}
              </div>
              {doctor.lat && doctor.lng && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    window.open(
                      `https://www.google.com/maps/dir/?api=1&destination=${doctor.lat},${doctor.lng}`,
                      "_blank"
                    )
                  }
                >
                  <Navigation className="h-3.5 w-3.5 mr-1" />
                  Lihat di Google Maps
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Quick Info */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-base">Informasi Praktik</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Biaya Konsultasi
                </span>
                <span className="font-semibold text-foreground">
                  {formatCurrency(doctor.fee)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Pengalaman
                </span>
                <span className="font-semibold text-foreground">
                  {doctor.experience_years} tahun
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Rating
                </span>
                <span className="font-semibold text-foreground flex items-center gap-1">
                  {doctor.rating}
                  <Star className="h-3.5 w-3.5 text-warning fill-warning" />
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Total Pasien
                </span>
                <span className="font-semibold text-foreground">
                  {doctor.total_patients.toLocaleString("id-ID")}
                </span>
              </div>
              {doctor.phone && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Telepon RS
                  </span>
                  <a
                    href={`tel:${doctor.phone}`}
                    className="font-semibold text-primary hover:underline"
                  >
                    {doctor.phone}
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* CTA */}
          {doctor.is_available && (
            <Card className="shadow-card border-primary/20 bg-primary/5">
              <CardContent className="p-5 text-center">
                <MessageCircle className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="font-semibold text-foreground mb-1">
                  Konsultasi Sekarang
                </p>
                <p className="text-sm text-muted-foreground mb-3">
                  Dokter sedang online dan siap menerima konsultasi
                </p>
                <Button className="w-full" onClick={handleStartChat}>
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Mulai Chat
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
