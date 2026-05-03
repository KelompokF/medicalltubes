import { useState, useEffect } from "react";
import { Calendar, MapPin, FileText, Phone, User, Clock, Stethoscope } from "lucide-react";
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
import { homeVisitScheduleService } from "@/services/api";

const todayStr = new Date().toISOString().split("T")[0];

interface Doctor {
  id: string;
  full_name: string;
  specialization?: string;
}

export default function HomeVisitBookingPage() {
  const [patientName, setPatientName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [complaint, setComplaint] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingDoctors, setIsFetchingDoctors] = useState(false);

  /** Ambil daftar dokter saat komponen dimuat */
  useEffect(() => {
    const fetchDoctors = async () => {
      setIsFetchingDoctors(true);
      try {
        const response = await doctorService.searchDoctors({ page: 1 });
        // Sesuaikan dengan struktur respons API (asumsi response.data.items atau response.data)
        const docs = Array.isArray(response.data) ? response.data : response.data.items || [];
        setDoctors(docs);
      } catch (err) {
        console.error("Gagal mengambil daftar dokter:", err);
        // Fallback dummy data jika API gagal
        setDoctors([
          { id: "d1", full_name: "Dr. Sarah Johnson", specialization: "Cardiologist" },
          { id: "d2", full_name: "Dr. Michael Chen", specialization: "General Practitioner" }
        ]);
      } finally {
        setIsFetchingDoctors(false);
      }
    };
    fetchDoctors();
  }, []);

  /** Kirim permintaan home visit ke backend */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!patientName || !address || !phoneNumber || !complaint || !preferredDate || !preferredTime || !selectedDoctorId) {
      toast.error("Semua field harus diisi termasuk pemilihan dokter");
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        patient_name: patientName,
        doctor_id: selectedDoctorId,
        address,
        phone_number: phone,
        complaint,
        preferred_date: new Date(selectedDate).toISOString(),
        preferred_time: selectedTime,
      };

      console.log("Submit payload:", payload);

      const response = await homeVisitScheduleService.submitRequest(payload);
      console.log("Success:", response.data);

      toast.success("Permintaan kunjungan rumah berhasil dikirim!");

      // Reset form
      setPatientName("");
      setAddress("");
      setPhone("");
      setComplaint("");
      setSelectedDate("");
      setSelectedTime("");
      setSelectedDoctor("");
      setAvailableTimes([]);
      setAvailableDoctors([]);
      setSelectedHari("");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Gagal mengirim permintaan.");
      toast.error("Gagal mengirim permintaan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = patientName && address && phoneNumber && complaint && preferredDate && preferredTime && selectedDoctorId;
  const selectedDoctor = doctors.find(d => d.id === selectedDoctorId);

  return (
    <div className="space-y-6 animate-fade-in relative z-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pesan Kunjungan Rumah</h1>
          <p className="text-muted-foreground mt-1">Isi formulir untuk meminta dokter mengunjungi Anda.</p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-destructive">
          <p className="font-medium">Terjadi kesalahan saat memuat data Home Visit.</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

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
          <div className="lg:col-span-2 space-y-6 relative z-20">

            {/* Pilih Dokter */}
            <Card className="shadow-card border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Stethoscope className="h-5 w-5 text-primary" />
                  Pilih Dokter
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Label htmlFor="doctor-select">Dokter yang Tersedia <span className="text-destructive">*</span></Label>
                <Select value={selectedDoctorId} onValueChange={setSelectedDoctorId}>
                  <SelectTrigger id="doctor-select" className="mt-1 bg-background">
                    <SelectValue placeholder={isFetchingDoctors ? "Memuat dokter..." : "Pilih dokter untuk kunjungan"} />
                  </SelectTrigger>
                  <SelectContent>
                    {doctors.map((doc) => (
                      <SelectItem key={doc.id} value={doc.id}>
                        {doc.full_name} {doc.specialization ? `(${doc.specialization})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground mt-2">
                  * Dokter yang Anda pilih akan meninjau keluhan Anda sebelum melakukan kunjungan.
                </p>
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
                  <Calendar className="h-5 w-5 text-primary" />
                  Jadwal Kunjungan
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="preferred-date">Tanggal <span className="text-destructive">*</span></Label>
                  <Input id="preferred-date" type="date" value={preferredDate} onChange={(e) => setPreferredDate(e.target.value)} min={todayStr} className="mt-1" required />
                </div>
                <div>
                  <Label htmlFor="preferred-time">Jam <span className="text-destructive">*</span></Label>
                  <div className="relative mt-1">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="preferred-time" type="time" value={preferredTime} onChange={(e) => setPreferredTime(e.target.value)} className="pl-9" required />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Alamat & Keluhan */}
            <Card className="shadow-card">
              <CardHeader><CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5 text-primary" /> Alamat & Keluhan</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="address">Alamat Lengkap <span className="text-destructive">*</span></Label>
                  <Textarea
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Alamat lengkap lokasi kunjungan"
                    className="mt-1"
                    required
                  />
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
                <span className="truncate max-w-[120px]">{selectedDoctor?.full_name || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span>Pasien</span>
                <span className="truncate max-w-[120px]">{patientName || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span>Waktu</span>
                <span>{preferredDate ? `${preferredDate} ${preferredTime}` : "-"}</span>
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
