import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Calendar, Clock, MapPin, Search, CalendarPlus, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { doctorService } from "@/services/api";

interface Doctor {
  id: string;
  full_name: string;
  specialization?: string;
}

export default function HomeVisitSchedulePage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchDoctors = async () => {
      setIsLoading(true);
      try {
        const response = await doctorService.searchDoctors({ page: 1 });
        const docs = Array.isArray(response.data) ? response.data : response.data.items || [];
        setDoctors(docs);
      } catch (err) {
        console.error("Gagal mengambil daftar dokter:", err);
        setDoctors([
          { id: "d1", full_name: "Dr. Sarah Johnson", specialization: "Cardiologist" },
          { id: "d2", full_name: "Dr. Michael Chen", specialization: "General Practitioner" },
          { id: "d3", full_name: "Dr. Andi Pratama", specialization: "Neurologist" },
          { id: "d4", full_name: "Dr. Budi Santoso", specialization: "Pediatrician" },
        ]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDoctors();
  }, []);

  const filtered = doctors.filter((doc) =>
    doc.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (doc.specialization && doc.specialization.toLowerCase().includes(search.toLowerCase()))
  );

  // Mocked schedules generator based on doctor id to keep it consistent
  const getDoctorSchedules = (docId: string) => {
    const days = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const times = ["08:00 - 12:00", "13:00 - 17:00", "09:00 - 14:00", "15:00 - 19:00"];

    // Simple deterministic random logic based on string
    const seed = docId.charCodeAt(0) + docId.charCodeAt(docId.length - 1);
    const result = [];

    // Add 2-3 random schedule slots
    const numSlots = (seed % 2) + 2;
    for (let i = 0; i < numSlots; i++) {
      result.push({
        day: days[(seed + i * 2) % days.length],
        time: times[(seed + i) % times.length],
        status: i === 1 ? "Penuh" : "Tersedia",
      });
    }

    return result;
  };

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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Calendar className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
          <h3 className="text-lg font-medium">Tidak ada dokter ditemukan</h3>
          <p className="text-muted-foreground">Coba ubah kata kunci pencarian Anda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {filtered.map((doctor) => {
            const schedules = getDoctorSchedules(doctor.id);
            const initials = doctor.full_name
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
                      <h3 className="font-semibold text-lg text-foreground">{doctor.full_name}</h3>
                      <p className="text-sm text-primary font-medium">{doctor.specialization || "Umum"}</p>

                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="bg-primary/5 border-primary/20 text-primary">
                          <User className="h-3 w-3 mr-1" /> Home Visit Available
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="p-5">
                    <h4 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <Clock className="h-4 w-4" /> Jadwal Praktik
                    </h4>
                    <div className="space-y-3">
                      {schedules.map((schedule, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-background hover:bg-muted/30 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-md bg-primary/10 flex flex-col items-center justify-center text-primary">
                              <span className="text-xs font-bold">{schedule.day.substring(0, 3)}</span>
                            </div>
                            <div>
                              <p className="font-medium text-sm">{schedule.day}</p>
                              <p className="text-xs text-muted-foreground">{schedule.time}</p>
                            </div>
                          </div>
                          <div>
                            <Badge
                              variant="secondary"
                              className={schedule.status === "Tersedia" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}
                            >
                              {schedule.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-5">
                      <Button className="w-full" variant="outline" asChild>
                        <Link to={`/home-visit?doctor_id=${doctor.id}`}>
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
