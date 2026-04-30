import { useState, useEffect, FormEvent } from "react";
import { Calendar, MapPin, Phone, User, Stethoscope } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
<<<<<<< Updated upstream
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
=======
>>>>>>> Stashed changes
import { toast } from "sonner";
import api, { doctorService } from "@/services/api";

// Ambil tanggal hari ini dalam format YYYY-MM-DD untuk input min
const todayStr = new Date().toISOString().split("T")[0];

const hariMap = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

const getHariIndonesia = (dateString: string): string => {
  // Fix timezone offset issue: parse as local date
  const [year, month, day] = dateString.split("-").map(Number);
  const localDate = new Date(year, month - 1, day);
  return hariMap[localDate.getDay()];
};

<<<<<<< Updated upstream
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
=======
interface AvailableDoctor {
  doctor_id: string;
  name: string;
  specialization: string;
}

export default function HomeVisitBookingPage() {
  // --- Schedule state ---
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedHari, setSelectedHari] = useState("");
  const [availableDoctors, setAvailableDoctors] = useState<AvailableDoctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState("");
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [loadingTimes, setLoadingTimes] = useState(false);

  // --- Form state ---
>>>>>>> Stashed changes
  const [patientName, setPatientName] = useState("");
  const [address, setAddress] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [complaint, setComplaint] = useState("");
<<<<<<< Updated upstream
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingDoctors, setIsFetchingDoctors] = useState(false);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
=======
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
>>>>>>> Stashed changes

  // =====================
  // STEP 1: Saat user pilih tanggal → auto load dokter
  // =====================
  useEffect(() => {
    if (!selectedDate) {
      setSelectedHari("");
      setAvailableDoctors([]);
      setSelectedDoctor("");
      setAvailableTimes([]);
      setSelectedTime("");
      setError(null);
      return;
    }

    const loadDoctors = async () => {
      const hari = getHariIndonesia(selectedDate);
      setSelectedHari(hari);
      setSelectedDoctor("");
      setAvailableTimes([]);
      setSelectedTime("");
      setLoadingDoctors(true);
      setError(null);

      console.log("Tanggal:", selectedDate);
      console.log("Hari:", hari);

      try {
<<<<<<< Updated upstream
        const response = await doctorService.getDoctorSchedules();
        const docs = Array.isArray(response.data) ? response.data : response.data.doctors || [];
        setDoctors(docs);
      } catch (err) {
        console.error("Gagal mengambil daftar dokter:", err);
        toast.error("Gagal mengambil daftar dokter. Silakan refresh halaman.");
        setDoctors([]);
=======
        const res = await homeVisitScheduleService.getAvailableDoctors(hari);
        const doctors: AvailableDoctor[] = res.data || [];
        setAvailableDoctors(doctors);

        console.log("Doctors:", doctors);

        // Auto-select jika hanya 1 dokter
        if (doctors.length === 1) {
          setSelectedDoctor(doctors[0].doctor_id);
        }
      } catch (err: any) {
        console.error(err);
        setAvailableDoctors([]);
        setError("Tidak dapat memuat data dokter. Periksa koneksi ke server.");
>>>>>>> Stashed changes
      } finally {
        setLoadingDoctors(false);
      }
    };

    loadDoctors();
  }, [selectedDate]);

  // =====================
  // STEP 2: Saat user pilih dokter → auto load jam
  // =====================
  useEffect(() => {
    if (!selectedDoctor || !selectedHari) {
      setAvailableTimes([]);
      setSelectedTime("");
      return;
    }

<<<<<<< Updated upstream
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
=======
    const loadTimes = async () => {
      setLoadingTimes(true);
      setSelectedTime("");

      console.log("Selected:", selectedDoctor);

      try {
        const res = await homeVisitScheduleService.getAvailableTimes(selectedDoctor, selectedHari);
        const times: string[] = res.data || [];
        setAvailableTimes(times);

        console.log("Times:", times);

        // Auto-select jika hanya 1 jam
        if (times.length === 1) {
          setSelectedTime(times[0]);
        }
      } catch (err: any) {
        console.error(err);
        setAvailableTimes([]);
      } finally {
        setLoadingTimes(false);
      }
    };
>>>>>>> Stashed changes

    loadTimes();
  }, [selectedDoctor, selectedHari]);

  // =====================
  // SUBMIT
  // =====================
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

<<<<<<< Updated upstream
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
=======
    if (!isFormValid) {
      toast.error("Semua field harus diisi");
      return;
    }

    setLoading(true);
>>>>>>> Stashed changes
    try {
      const selectedDoc = doctors.find(d => d.id === selectedDoctorId);
      
      const payload = {
        patient_name: patientName,
<<<<<<< Updated upstream
        doctor_id: selectedDoc?.doctor_id, // Use the actual doctor user ID
=======
        doctor_id: selectedDoctor,
>>>>>>> Stashed changes
        address,
        phone_number: phoneNumber,
        complaint,
        preferred_date: new Date(selectedDate).toISOString(),
        preferred_time: selectedTime,
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
      setSelectedDate("");
      setSelectedTime("");
      setSelectedDoctor("");
      setAvailableTimes([]);
      setAvailableDoctors([]);
      setSelectedHari("");
    } catch (err: any) {
      console.error("Error submitting form:", err.response?.data || err);
      const detail = err?.response?.data?.detail;
      toast.error(typeof detail === "string" ? detail : "Gagal mengirim permintaan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

<<<<<<< Updated upstream
  const isFormValid = patientName && address && phoneNumber && complaint && preferredDate && preferredTime && selectedDoctorId;
  const selectedDoctor = doctors.find(d => d.id === selectedDoctorId);
=======
  const isFormValid = Boolean(
    patientName &&
    address &&
    phone &&
    complaint &&
    selectedDate &&
    selectedTime &&
    selectedDoctor
  );
>>>>>>> Stashed changes

  const selectedDoctorData = availableDoctors.find((d) => d.doctor_id === selectedDoctor);

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

<<<<<<< Updated upstream
=======
      {error && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-destructive">
          <p className="font-medium">Terjadi kesalahan saat memuat data Home Visit.</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

>>>>>>> Stashed changes
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">

<<<<<<< Updated upstream
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
=======
            {/* SECTION 1: Jadwal Kunjungan */}
            <Card className="shadow-card border-primary/20 bg-primary/5 relative z-30 overflow-visible">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
>>>>>>> Stashed changes
                  <Calendar className="h-5 w-5 text-primary" />
                  Jadwal Kunjungan
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-40 overflow-visible">
                {/* Kiri: Tanggal */}
                <div>
<<<<<<< Updated upstream
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
=======
                  <Label htmlFor="date-select">Tanggal <span className="text-destructive">*</span></Label>
                  <Input
                    id="date-select"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={todayStr}
                    className="mt-1 bg-background"
                    required
>>>>>>> Stashed changes
                  />
                  {selectedHari && (
                    <p className="text-[10px] text-muted-foreground mt-1">Hari: {selectedHari}</p>
                  )}
                </div>

<<<<<<< Updated upstream
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
=======
                {/* Tengah: Dokter */}
                <div className="relative z-50">
                  <Label htmlFor="doctor-select">Dokter <span className="text-destructive">*</span></Label>
                  <select
                    id="doctor-select"
                    value={selectedDoctor}
                    onChange={(e) => setSelectedDoctor(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring mt-1"
                    required
                  >
                    <option value="">
                      {loadingDoctors
                        ? "Memuat dokter..."
                        : availableDoctors.length === 0 && selectedDate
                          ? "Tidak ada dokter tersedia"
                          : "Pilih dokter"}
                    </option>
                    {availableDoctors.map((doc) => (
                      <option key={doc.doctor_id} value={doc.doctor_id}>
                        {doc.name} {doc.specialization ? `- ${doc.specialization}` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Kanan: Jam */}
                <div className="relative z-50">
                  <Label htmlFor="time-select">Jam <span className="text-destructive">*</span></Label>
                  <select
                    id="time-select"
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring mt-1"
                    required
                  >
                    <option value="">
                      {loadingTimes
                        ? "Memuat jam..."
                        : availableTimes.length === 0 && selectedDoctor
                          ? "Tidak ada jadwal"
                          : "Pilih jam"}
                    </option>
                    {availableTimes.map((jam) => (
                      <option key={jam} value={jam}>
                        {jam}
                      </option>
                    ))}
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* SECTION 2: Informasi Pasien */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Informasi Pasien
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="patient-name">Nama Lengkap Pasien <span className="text-destructive">*</span></Label>
                  <Input
                    id="patient-name"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="Nama lengkap"
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone-number">Nomor Telepon <span className="text-destructive">*</span></Label>
                  <div className="relative mt-1">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone-number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="08xx"
                      className="pl-9"
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* SECTION 3: Alamat & Keluhan */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Alamat &amp; Keluhan
                </CardTitle>
              </CardHeader>
>>>>>>> Stashed changes
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="address">Alamat Lengkap <span className="text-destructive">*</span></Label>
                  <Textarea id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Alamat lengkap lokasi kunjungan" className="mt-1" required />
                </div>
                <div>
                  <Label htmlFor="complaint">Keluhan <span className="text-destructive">*</span></Label>
<<<<<<< Updated upstream
                  <Textarea id="complaint" value={complaint} onChange={(e) => setComplaint(e.target.value)} placeholder="Deskripsikan kondisi kesehatan Anda" className="mt-1" required />
=======
                  <Textarea
                    id="complaint"
                    value={complaint}
                    onChange={(e) => setComplaint(e.target.value)}
                    placeholder="Deskripsikan kondisi kesehatan Anda"
                    className="mt-1"
                    required
                  />
                </div>
              </CardContent>
            </Card>

          </div>

          {/* SECTION 4: Ringkasan & Submit */}
          <div className="space-y-6">
            <Card className="shadow-card sticky top-24">
              <CardHeader>
                <CardTitle>Ringkasan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between font-medium text-primary border-b pb-2">
                  <span>Dokter</span>
                  <span className="text-right">
                    {selectedDoctorData
                      ? `${selectedDoctorData.name}${selectedDoctorData.specialization ? `, ${selectedDoctorData.specialization}` : ""}`
                      : "-"}
                  </span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span>Pasien</span>
                  <span className="text-right">{patientName || "-"}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span>Tanggal</span>
                  <span className="text-right">{selectedDate ? `${selectedDate} (${selectedHari})` : "-"}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span>Jam</span>
                  <span className="text-right">{selectedTime || "-"}</span>
                </div>
                <div className="flex justify-between border-b pb-2 flex-col gap-1">
                  <span>Alamat:</span>
                  <span className="text-muted-foreground whitespace-pre-wrap">{address || "-"}</span>
                </div>
                <div className="flex justify-between flex-col gap-1">
                  <span>Keluhan:</span>
                  <span className="text-muted-foreground whitespace-pre-wrap">{complaint || "-"}</span>
                </div>
                <div className="pt-4">
                  <Button
                    type="submit"
                    className="w-full medical-gradient text-primary-foreground"
                    disabled={!isFormValid || loading}
                  >
                    {loading ? "Mengirim..." : "Konfirmasi & Pesan"}
                  </Button>
>>>>>>> Stashed changes
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
