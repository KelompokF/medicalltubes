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
import { doctorService, doctorScheduleService, DoctorScheduleResponse } from "@/services/api";

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
  const [schedule, setSchedule] = useState<DoctorScheduleResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDoctorData = async () => {
      if (!id) return;
      setIsLoading(true);
      setError(null);
      try {
        // Fetch doctor profile
        const docRes = await doctorService.getDoctorById(id);
        setDoctor(docRes.data);

        // Fetch doctor schedule
        try {
          const schedRes = await doctorScheduleService.getSchedule(id);
          setSchedule(schedRes.data);
        } catch (schedErr) {
          console.warn("Jadwal tidak ditemukan atau error:", schedErr);
        }
      } catch (err: any) {
        console.error("Error fetching doctor:", err);
        setError("Dokter tidak ditemukan.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchDoctorData();
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
        <p className="text-muted-foreground font-medium">Memuat data dokter...</p>
      </div>
    );
  }

  if (error || !doctor) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
        <div className="rounded-full bg-red-50 p-6 mb-4">
          <User className="h-10 w-10 text-red-400" />
        </div>
        <p className="text-slate-600 mb-6 font-medium">
          {error || "Dokter tidak ditemukan."}
        </p>
        <Button variant="outline" className="rounded-full" asChild>
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
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-6 animate-fade-in w-full pb-12 mt-2">
      <Button variant="ghost" size="sm" asChild className="hover:bg-slate-100 hover:text-slate-900 transition-colors rounded-xl text-slate-500 -ml-2 mb-2">
        <Link to="/search-doctor">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali ke Pencarian
        </Link>
      </Button>

      {/* Header Card */}
      <Card className="border-0 shadow-lg overflow-hidden rounded-[2rem] bg-white">
        <div className="h-36 bg-gradient-to-r from-primary/90 via-primary/70 to-primary/50 relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary-foreground/10 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4"></div>
        </div>
        <CardContent className="relative pt-0 pb-8 px-6 sm:px-10">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 -mt-16">
            <div className="h-32 w-32 rounded-3xl bg-white border-4 border-white shadow-lg flex items-center justify-center text-primary font-black text-4xl shrink-0 relative z-10">
              {initials}
              {doctor.is_available && (
                <div className="absolute top-2 right-2 h-4 w-4 rounded-full bg-green-500 border-2 border-white shadow-sm animate-pulse"></div>
              )}
            </div>
            <div className="flex-1 mt-2 sm:mt-5 text-center sm:text-left w-full">
              <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                    {doctor.name}
                  </h1>
                  <p className="text-primary font-bold text-lg mt-1">
                    {doctor.specialization}
                  </p>
                </div>
                <Badge
                  variant={doctor.is_available ? "default" : "secondary"}
                  className={`px-4 py-1.5 text-sm font-bold rounded-full shadow-sm mt-2 sm:mt-0 ${doctor.is_available
                    ? "bg-green-100 text-green-700 border border-green-200 hover:bg-green-200"
                    : "bg-slate-100 text-slate-600 border border-slate-200"
                    }`}
                >
                  {doctor.is_available ? "Tersedia Sekarang" : "Sedang Offline"}
                </Badge>
              </div>

              <div className="flex flex-wrap justify-center sm:justify-start gap-4 mt-5 text-sm text-slate-600 font-medium">
                <span className="flex items-center gap-1.5 bg-amber-50 text-amber-800 px-3.5 py-1.5 rounded-xl border border-amber-100 font-semibold shadow-sm">
                  <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                  {doctor.rating} ({doctor.total_reviews} ulasan)
                </span>
                <span className="flex items-center gap-1.5 bg-blue-50 text-blue-800 px-3.5 py-1.5 rounded-xl border border-blue-100 font-semibold shadow-sm">
                  <Clock className="h-4 w-4 text-blue-500" />
                  {doctor.experience_years} thn pengalaman
                </span>
                <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 px-3.5 py-1.5 rounded-xl border border-emerald-100 font-semibold shadow-sm">
                  <Users className="h-4 w-4 text-emerald-500" />
                  {doctor.total_patients} pasien
                </span>
              </div>

              <div className="flex flex-wrap justify-center sm:justify-start gap-3 mt-6">
                {doctor.is_available && (
                  <Button onClick={handleStartChat} size="lg" className="rounded-xl px-6 shadow-md hover:shadow-lg transition-all bg-primary hover:bg-primary/90 text-white font-semibold">
                    <MessageCircle className="h-5 w-5 mr-2" />
                    Mulai Konsultasi
                  </Button>
                )}
                <Button variant="outline" size="lg" className="rounded-xl px-6 border-2 hover:bg-primary/5 text-primary border-primary/20 transition-colors font-semibold shadow-sm" asChild>
                  <Link to="/home-visit">
                    <Calendar className="h-5 w-5 mr-2" />
                    Kunjungan Rumah
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-4">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* About */}
          <Card className="border-0 shadow-md rounded-[2rem] overflow-hidden bg-white">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-5 pt-6 px-8">
              <CardTitle className="flex items-center gap-3 text-xl font-bold text-slate-800">
                <div className="p-2.5 bg-primary/10 rounded-xl">
                  <Stethoscope className="h-5 w-5 text-primary" />
                </div>
                Tentang Dokter
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <p className="text-slate-600 leading-relaxed text-[15px] sm:text-base">
                {doctor.about || "Informasi dokter belum tersedia. Silakan hubungi klinik atau rumah sakit untuk detail lebih lanjut."}
              </p>
            </CardContent>
          </Card>

          {/* Schedule Section */}
          <Card className="border-0 shadow-md rounded-[2rem] overflow-hidden bg-white">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-5 pt-6 px-8">
              <CardTitle className="flex items-center gap-3 text-xl font-bold text-slate-800">
                <div className="p-2.5 bg-primary/10 rounded-xl">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                Jadwal Praktik (Home Visit)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              {!schedule || schedule.schedule.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <div className="bg-white p-4 rounded-full shadow-sm mb-3">
                    <Calendar className="h-8 w-8 text-slate-300" />
                  </div>
                  <p className="text-slate-600 font-semibold">
                    Belum ada jadwal praktik yang tersedia.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {schedule.schedule.map((day) => (
                    <div key={day.hari} className="p-5 rounded-2xl border border-slate-100 bg-white hover:border-primary/30 transition-colors shadow-sm group">
                      <p className="text-lg font-bold text-slate-800 mb-4 group-hover:text-primary transition-colors">{day.hari}</p>
                      <div className="flex flex-wrap gap-2.5">
                        {day.slots.map((slot) => (
                          <Badge key={slot} variant="secondary" className="bg-slate-50 hover:bg-primary/5 text-slate-700 hover:text-primary border border-slate-200 hover:border-primary/30 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all">
                            <Clock className="h-3.5 w-3.5 mr-1.5 text-primary/60" />
                            {slot}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Hospital Info */}
          <Card className="border-0 shadow-md rounded-[2rem] overflow-hidden relative group bg-white">
            <div className="absolute left-0 top-0 w-2 h-full bg-primary/80 group-hover:bg-primary transition-colors"></div>
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-5 pt-6 pl-10 pr-8">
              <CardTitle className="flex items-center gap-3 text-xl font-bold text-slate-800">
                <div className="p-2.5 bg-primary/10 rounded-xl">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                Rumah Sakit / Klinik Utama
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 pl-10">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div className="space-y-2">
                  <p className="font-extrabold text-xl text-slate-900">
                    {doctor.hospital_name}
                  </p>
                  {doctor.hospital_address && (
                    <p className="text-[15px] text-slate-500 flex items-start gap-2.5 max-w-md font-medium leading-relaxed">
                      <MapPin className="h-5 w-5 shrink-0 mt-0.5 text-slate-400" />
                      <span>{doctor.hospital_address}</span>
                    </p>
                  )}
                </div>
                {doctor.lat && doctor.lng && (
                  <Button
                    variant="outline"
                    className="shrink-0 rounded-xl h-12 px-6 border-2 border-slate-200 hover:bg-slate-50 font-bold shadow-sm"
                    onClick={() =>
                      window.open(
                        `https://www.google.com/maps/dir/?api=1&destination=${doctor.lat},${doctor.lng}`,
                        "_blank"
                      )
                    }
                  >
                    <Navigation className="h-4 w-4 mr-2 text-primary" />
                    Lihat di Google Maps
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          {/* Quick Info */}
          <Card className="border-0 shadow-md rounded-[2rem] overflow-hidden bg-white">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-5 pt-6 px-8">
              <CardTitle className="text-lg font-bold text-slate-800">Informasi Praktik</CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-primary/5 border border-primary/10">
                <span className="text-[15px] text-primary/80 flex items-center gap-2.5 font-bold">
                  <DollarSign className="h-5 w-5" />
                  Biaya Konsultasi
                </span>
                <span className="font-black text-2xl text-primary">
                  {formatCurrency(doctor.fee)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[15px] text-slate-600 flex items-center gap-2.5 font-medium">
                  <Clock className="h-5 w-5 text-slate-400" />
                  Pengalaman
                </span>
                <span className="font-bold text-slate-800 bg-slate-100 px-3 py-1.5 rounded-lg text-sm">
                  {doctor.experience_years} tahun
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[15px] text-slate-600 flex items-center gap-2.5 font-medium">
                  <Star className="h-5 w-5 text-slate-400" />
                  Rating
                </span>
                <span className="font-bold text-slate-800 bg-amber-50 px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 border border-amber-100">
                  {doctor.rating}
                  <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[15px] text-slate-600 flex items-center gap-2.5 font-medium">
                  <Users className="h-5 w-5 text-slate-400" />
                  Total Pasien
                </span>
                <span className="font-bold text-slate-800 bg-slate-100 px-3 py-1.5 rounded-lg text-sm">
                  {doctor.total_patients.toLocaleString("id-ID")}
                </span>
              </div>
              {doctor.phone && (
                <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-100">
                  <span className="text-[15px] text-slate-600 flex items-center gap-2.5 font-medium">
                    <Phone className="h-5 w-5 text-slate-400" />
                    Telepon RS
                  </span>
                  <a
                    href={`tel:${doctor.phone}`}
                    className="font-bold text-primary hover:text-primary/80 hover:underline transition-colors bg-primary/10 px-3.5 py-1.5 rounded-xl"
                  >
                    {doctor.phone}
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* CTA */}
          {doctor.is_available && (
            <Card className="border-0 shadow-lg rounded-[2rem] overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-transparent relative border border-primary/10">
              <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>
              <CardContent className="p-8 text-center relative z-10">
                <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center mx-auto mb-5 shadow-sm border border-primary/10">
                  <MessageCircle className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-extrabold text-2xl text-slate-900 mb-2">
                  Konsultasi Sekarang
                </h3>
                <p className="text-[15px] text-slate-600 mb-8 leading-relaxed font-medium">
                  Dokter sedang online dan siap menerima konsultasi via chat saat ini juga.
                </p>
                <Button className="w-full rounded-2xl h-14 text-base font-bold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all bg-primary hover:bg-primary/90 text-white" onClick={handleStartChat}>
                  <MessageCircle className="h-5 w-5 mr-2" />
                  Mulai Chat Sekarang
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}