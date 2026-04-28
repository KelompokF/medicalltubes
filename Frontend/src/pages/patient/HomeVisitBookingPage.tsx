import { useState, useEffect } from "react";
import { Calendar, MapPin, FileText, Phone, User, Clock, Stethoscope, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import api, { doctorService } from "@/services/api";

// Ambil tanggal hari ini dalam format YYYY-MM-DD untuk input min
const todayStr = new Date().toISOString().split("T")[0];

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

const dayOfWeekEnglish: { [key: string]: string } = {
  senin: "monday",
  selasa: "tuesday",
  rabu: "wednesday",
  kamis: "thursday",
  jumat: "friday",
  sabtu: "saturday",
  minggu: "sunday",
};

export default function HomeVisitBookingPage() {
  const [patientName, setPatientName] = useState("");
  const [address, setAddress] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [complaint, setComplaint] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingDoctors, setIsFetchingDoctors] = useState(false);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);

  /** Ambil daftar dokter dengan jadwal mereka saat komponen dimuat */
  useEffect(() => {
    const fetchDoctorsWithSchedules = async () => {
      setIsFetchingDoctors(true);
      try {
        const response = await doctorService.getDoctorSchedules();
        const docs = Array.isArray(response.data) ? response.data : response.data.doctors || [];
        setDoctors(docs);
      } catch (err) {
        console.error("Gagal mengambil daftar dokter:", err);
        toast.error("Gagal mengambil daftar dokter. Silakan refresh halaman.");
        setDoctors([]);
      } finally {
        setIsFetchingDoctors(false);
      }
    };
    fetchDoctorsWithSchedules();
  }, []);

  /** Update available time slots ketika tanggal atau dokter berubah */
  useEffect(() => {
    if (!preferredDate || !selectedDoctorId) {
      setAvailableTimeSlots([]);
      return;
    }

    const selectedDoctor = doctors.find(d => d.id === selectedDoctorId);
    if (!selectedDoctor || !selectedDoctor.schedules) {
      setAvailableTimeSlots([]);
      return;
    }

    // Get day of week from selected date
    const date = new Date(preferredDate);
    const dayIndex = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Convert dayIndex to day name
    const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const selectedDayOfWeek = dayNames[dayIndex];

    // Find schedules for the selected day
    const daySchedules = selectedDoctor.schedules.filter(
      s => s.day_of_week === selectedDayOfWeek && s.is_active
    );

    // Extract time slots from schedules
    const slots = daySchedules.map(s => {
      return `${s.start_time} - ${s.end_time}`;
    });

    setAvailableTimeSlots(slots.length > 0 ? slots : []);
  }, [preferredDate, selectedDoctorId, doctors]);

  /** Kirim permintaan home visit ke backend */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!patientName || !address || !phoneNumber || !complaint || !preferredDate || !preferredTime || !selectedDoctorId) {
      toast.error("Semua field harus diisi termasuk pemilihan dokter dan jadwal");
      return;
    }

    // Validate time slot is selected
    if (!availableTimeSlots.includes(preferredTime)) {
      toast.error("Pilih jadwal yang tersedia");
      return;
    }

    setIsLoading(true);
    try {
      const selectedDoc = doctors.find(d => d.id === selectedDoctorId);
      
      const payload = {
        patient_name: patientName,
        doctor_id: selectedDoc?.doctor_id, // Use the actual doctor user ID
        address,
        phone_number: phoneNumber,
        complaint,
        preferred_date: new Date(preferredDate).toISOString(),
        preferred_time: preferredTime,
      };
      
      console.log("Sending payload:", payload);
      const response = await api.post("/home-visit/", payload);
      console.log("Success:", response.data);
      
      toast.success("Permintaan kunjungan rumah berhasil dikirim!");

      // Reset form
      setPatientName("");
      setAddress("");
      setPhoneNumber("");
      setComplaint("");
      setPreferredDate("");
      setPreferredTime("");
      setSelectedDoctorId("");
      setAvailableTimeSlots([]);
    } catch (err: any) {
      console.error("Error submitting form:", err.response?.data || err);
      const detail = err?.response?.data?.detail;
      toast.error(typeof detail === "string" ? detail : "Gagal mengirim permintaan. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = patientName && address && phoneNumber && complaint && preferredDate && preferredTime && selectedDoctorId;
  const selectedDoctor = doctors.find(d => d.id === selectedDoctorId);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pesan Kunjungan Rumah</h1>
          <p className="text-muted-foreground mt-1">Isi formulir untuk meminta dokter mengunjungi Anda.</p>
        </div>
        <Button variant="outline" onClick={() => window.location.href = "/home-visit-history"}>
          Lihat Riwayat Kunjungan
        </Button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">

            {/* Pilih Dokter */}
            <Card className="shadow-card border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Stethoscope className="h-5 w-5 text-primary" />
                  Pilih Dokter dari Database
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isFetchingDoctors ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : doctors.length === 0 ? (
                  <div className="p-4 text-center">
                    <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
                    <p className="text-muted-foreground">Tidak ada dokter tersedia saat ini</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 gap-3">
                      {doctors.map((doc) => (
                        <div
                          key={doc.id}
                          onClick={() => setSelectedDoctorId(doc.id)}
                          className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                            selectedDoctorId === doc.id
                              ? "border-primary bg-primary/10"
                              : "border-border hover:border-primary/50 bg-background"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <h3 className="font-semibold text-foreground">{doc.name}</h3>
                              <p className="text-sm text-primary font-medium">{doc.specialization || "Spesialis Umum"}</p>
                              
                              <div className="flex flex-wrap gap-2 mt-2">
                                {doc.hospital_name && (
                                  <span className="text-xs bg-secondary/30 px-2 py-1 rounded">
                                    🏥 {doc.hospital_name}
                                  </span>
                                )}
                                {doc.experience_years > 0 && (
                                  <span className="text-xs bg-secondary/30 px-2 py-1 rounded">
                                    📅 {doc.experience_years} tahun pengalaman
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-3 mt-2">
                                <div className="flex items-center gap-1">
                                  <span className="text-sm font-medium text-foreground">⭐ {doc.rating.toFixed(1)}</span>
                                </div>
                                {doc.fee > 0 && (
                                  <span className="text-sm text-muted-foreground">
                                    💰 Rp{(doc.fee / 1000).toFixed(0)}k per kunjungan
                                  </span>
                                )}
                              </div>

                              {doc.schedules && doc.schedules.length > 0 ? (
                                <div className="mt-2 p-2 bg-success/10 border border-success/20 rounded">
                                  <p className="text-xs text-success font-medium">✓ Memiliki {doc.schedules.length} jadwal tersedia</p>
                                </div>
                              ) : (
                                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                                  <p className="text-xs text-yellow-700">⚠️ Belum ada jadwal yang diatur</p>
                                </div>
                              )}
                            </div>

                            {selectedDoctorId === doc.id && (
                              <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold shrink-0">
                                ✓
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {selectedDoctorId && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-700">
                          ✓ Dokter dipilih: <strong>{selectedDoctor?.name}</strong>
                        </p>
                      </div>
                    )}

                    <p className="text-[10px] text-muted-foreground mt-3">
                      * Pilih dokter di atas untuk melihat jadwal kunjungan yang tersedia
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Informasi Pasien */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Informasi Pasien
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="patient-name">Nama Lengkap Pasien <span className="text-destructive">*</span></Label>
                  <Input id="patient-name" value={patientName} onChange={(e) => setPatientName(e.target.value)} placeholder="Nama lengkap" className="mt-1" required />
                </div>
                <div>
                  <Label htmlFor="phone-number">Nomor Telepon <span className="text-destructive">*</span></Label>
                  <div className="relative mt-1">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="phone-number" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="08xx" className="pl-9" required />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Jadwal */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Jadwal Kunjungan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="preferred-date">Tanggal <span className="text-destructive">*</span></Label>
                  <Input 
                    id="preferred-date" 
                    type="date" 
                    value={preferredDate} 
                    onChange={(e) => {
                      setPreferredDate(e.target.value);
                      setPreferredTime(""); // Reset time when date changes
                    }} 
                    min={todayStr} 
                    className="mt-1" 
                    required 
                    disabled={!selectedDoctorId}
                  />
                  {!selectedDoctorId && (
                    <p className="text-xs text-muted-foreground mt-1">Pilih dokter terlebih dahulu</p>
                  )}
                </div>

                {preferredDate && selectedDoctorId && (
                  <div>
                    <Label htmlFor="preferred-time">Jadwal Tersedia <span className="text-destructive">*</span></Label>
                    {availableTimeSlots.length > 0 ? (
                      <Select value={preferredTime} onValueChange={setPreferredTime}>
                        <SelectTrigger id="preferred-time" className="mt-1 bg-background">
                          <SelectValue placeholder="Pilih waktu kunjungan" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableTimeSlots.map((slot) => (
                            <SelectItem key={slot} value={slot}>
                              {slot}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2">
                        <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                        <p className="text-xs text-red-700">Dokter tidak tersedia pada tanggal ini. Pilih tanggal lain.</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Alamat & Keluhan */}
            <Card className="shadow-card">
              <CardHeader><CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5 text-primary" /> Alamat & Keluhan</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="address">Alamat Lengkap <span className="text-destructive">*</span></Label>
                  <Textarea id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Alamat lengkap lokasi kunjungan" className="mt-1" required />
                </div>
                <div>
                  <Label htmlFor="complaint">Keluhan <span className="text-destructive">*</span></Label>
                  <Textarea id="complaint" value={complaint} onChange={(e) => setComplaint(e.target.value)} placeholder="Deskripsikan kondisi kesehatan Anda" className="mt-1" required />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Ringkasan */}
          <Card className="shadow-card h-fit sticky top-24">
            <CardHeader><CardTitle>Ringkasan</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between font-medium text-primary">
                <span>Dokter</span>
                <span className="truncate max-w-[120px]">{selectedDoctor?.name || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span>Pasien</span>
                <span className="truncate max-w-[120px]">{patientName || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span>Waktu</span>
                <span>{preferredDate && preferredTime ? `${preferredDate} ${preferredTime}` : "-"}</span>
              </div>
              <div className="border-t pt-3">
                <Button type="submit" className="w-full medical-gradient text-primary-foreground" disabled={!isFormValid || isLoading}>
                  {isLoading ? "Mengirim..." : "Konfirmasi & Pesan"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
