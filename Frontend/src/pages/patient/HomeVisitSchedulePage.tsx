import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Calendar, Clock, CalendarPlus, User, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { doctorService } from "@/services/api";

interface Schedule {
  id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

interface Doctor {
  id: string;
  doctor_id: string;
  name: string;
  specialization?: string;
  hospital_name?: string;
  experience_years: number;
  fee: number;
  rating: number;
  is_available: boolean;
  schedules: Schedule[];
}

const dayOfWeekIndonesian: { [key: string]: string } = {
  monday: "Senin",
  tuesday: "Selasa",
  wednesday: "Rabu",
  thursday: "Kamis",
  friday: "Jumat",
  saturday: "Sabtu",
  sunday: "Minggu",
};

export default function HomeVisitSchedulePage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchDoctorsWithSchedules = async () => {
      setIsLoading(true);
      try {
        const response = await doctorService.getDoctorSchedules();
        const docsData = Array.isArray(response.data) ? response.data : response.data.doctors || [];
        setDoctors(docsData);
      } catch (err) {
        console.error("Gagal mengambil jadwal dokter:", err);
        setDoctors([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDoctorsWithSchedules();
  }, []);

  const filtered = doctors.filter((doc) =>
    doc.name.toLowerCase().includes(search.toLowerCase()) ||
    (doc.specialization && doc.specialization.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Jadwal Dokter Home Visit</h1>
          <p className="text-muted-foreground mt-1">
            Lihat ketersediaan dokter dan jadwalkan kunjungan rumah.
          </p>
        </div>
        <Button className="medical-gradient text-primary-foreground" asChild>
          <Link to="/home-visit">
            <CalendarPlus className="mr-2 h-4 w-4" /> Pesan Kunjungan Baru
          </Link>
        </Button>
      </div>

      {/* Pencarian */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari berdasarkan nama dokter atau spesialisasi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Daftar Dokter & Jadwal */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Calendar className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
          <h3 className="text-lg font-medium">Tidak ada dokter ditemukan</h3>
          <p className="text-muted-foreground">Coba ubah kata kunci pencarian Anda atau periksa lagi nanti.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {filtered.map((doctor) => {
            const initials = doctor.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();

            return (
              <Card key={doctor.id} className="shadow-card overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-5 border-b flex items-start gap-4 bg-muted/20">
                    <div className="h-14 w-14 rounded-full medical-gradient flex items-center justify-center text-primary-foreground font-bold text-lg shrink-0">
                      {initials}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-foreground">{doctor.name}</h3>
                      <p className="text-sm text-primary font-medium">{doctor.specialization || "Umum"}</p>
                      {doctor.hospital_name && (
                        <p className="text-xs text-muted-foreground mt-1">{doctor.hospital_name}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="bg-primary/5 border-primary/20 text-primary">
                          <User className="h-3 w-3 mr-1" /> Home Visit Tersedia
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="p-5">
                    <h4 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <Clock className="h-4 w-4" /> Jadwal Praktik
                    </h4>
                    {doctor.schedules && doctor.schedules.length > 0 ? (
                      <div className="space-y-3">
                        {doctor.schedules.map((schedule) => (
                          <div key={schedule.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-background hover:bg-muted/30 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-md bg-primary/10 flex flex-col items-center justify-center text-primary">
                                <span className="text-xs font-bold">{dayOfWeekIndonesian[schedule.day_of_week]?.substring(0, 3) || "???"}</span>
                              </div>
                              <div>
                                <p className="font-medium text-sm">{dayOfWeekIndonesian[schedule.day_of_week] || schedule.day_of_week}</p>
                                <p className="text-xs text-muted-foreground">{schedule.start_time} - {schedule.end_time}</p>
                              </div>
                            </div>
                            <Badge variant="secondary" className="bg-success/10 text-success">
                              Tersedia
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Tidak ada jadwal yang tersedia saat ini</p>
                    )}

                    <div className="mt-5">
                      <Button className="w-full" variant="outline" asChild>
                        <Link to={`/home-visit?doctor_id=${doctor.doctor_id}`}>
                          Pilih Dokter Ini
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
