import { useState, useEffect, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Calendar, MapPin, Phone, User, Clock, Stethoscope } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { homeVisitScheduleService } from "@/services/api";

const todayStr = new Date().toISOString().split("T")[0];

const hariMap = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

const getHariIndonesia = (dateString: string): string => {
  const [year, month, day] = dateString.split("-").map(Number);
  const localDate = new Date(year, month - 1, day);
  return hariMap[localDate.getDay()];
};

interface AvailableDoctor {
  doctor_id: string;
  name: string;
  specialization: string;
}

export default function HomeVisitBookingPage() {
  const { t } = useTranslation();
  // --- Schedule state ---
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedHari, setSelectedHari] = useState("");
  const [availableDoctors, setAvailableDoctors] = useState<AvailableDoctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState("");
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [loadingTimes, setLoadingTimes] = useState(false);
  const navigate = useNavigate();

  // --- Form state ---
  const [patientName, setPatientName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [complaint, setComplaint] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      try {
        const res = await homeVisitScheduleService.getAvailableDoctors(hari);
        const doctors: AvailableDoctor[] = res.data || [];
        setAvailableDoctors(doctors);

        if (doctors.length === 1) {
          setSelectedDoctor(doctors[0].doctor_id);
        }
      } catch (err: any) {
        console.error(err);
        setAvailableDoctors([]);
        setError(t("patient.homeVisitBooking.loadDoctorsFailed"));
      } finally {
        setLoadingDoctors(false);
      }
    };

    loadDoctors();
  }, [selectedDate]);

  useEffect(() => {
    if (!selectedDoctor || !selectedHari) {
      setAvailableTimes([]);
      setSelectedTime("");
      return;
    }

    const loadTimes = async () => {
      setLoadingTimes(true);
      setSelectedTime("");

      try {
        const res = await homeVisitScheduleService.getAvailableTimes(selectedDoctor, selectedHari);
        const times: string[] = res.data || [];
        setAvailableTimes(times);

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

    loadTimes();
  }, [selectedDoctor, selectedHari]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!isFormValid) {
      toast.error(t("patient.homeVisitBooking.allFieldsRequired"));
      return;
    }

    setLoading(true);
    try {
      const payload = {
        patient_name: patientName,
        doctor_id: selectedDoctor,
        address,
        phone_number: phone,
        complaint,
        preferred_date: new Date(selectedDate).toISOString(),
        preferred_time: selectedTime,
      };

      const response = await homeVisitScheduleService.submitRequest(payload);

      toast.success(t("patient.homeVisitBooking.bookingSuccess"));

      const requestId = response.data.id;
      navigate(`/home-visit/payment/${requestId}`);

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
      setError(err.message || t("patient.homeVisitBooking.bookingFailed"));
      toast.error(t("patient.homeVisitBooking.bookingFailed"));
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = Boolean(
    patientName &&
    address &&
    phone &&
    complaint &&
    selectedDate &&
    selectedTime &&
    selectedDoctor
  );

  const selectedDoctorData = availableDoctors.find((d) => d.doctor_id === selectedDoctor);

  return (
    <div className="space-y-6 animate-fade-in relative z-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("patient.homeVisitBooking.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("patient.homeVisitBooking.subtitle")}</p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-destructive">
          <p className="font-medium">{t("patient.homeVisitBooking.errorLoading")}</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6 relative z-20">

            {/* SECTION 1: Jadwal Kunjungan */}
            <Card className="shadow-card border-primary/20 bg-primary/5 relative z-30 overflow-visible">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  {t("patient.homeVisitBooking.visitSchedule")}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-40 overflow-visible">
                <div>
                  <Label htmlFor="date-select">{t("patient.homeVisitBooking.dateLabel")} <span className="text-destructive">*</span></Label>
                  <Input
                    id="date-select"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={todayStr}
                    className="mt-1 bg-background"
                    required
                  />
                  {selectedHari && (
                    <p className="text-[10px] text-muted-foreground mt-1">{t("patient.homeVisitBooking.dayLabel", { day: selectedHari })}</p>
                  )}
                </div>

                <div className="relative z-50">
                  <Label htmlFor="doctor-select">{t("patient.homeVisitBooking.doctorLabel")} <span className="text-destructive">*</span></Label>
                  <select
                    id="doctor-select"
                    value={selectedDoctor}
                    onChange={(e) => setSelectedDoctor(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring mt-1"
                    required
                  >
                    <option value="">
                      {loadingDoctors
                        ? t("patient.homeVisitBooking.loadingDoctors")
                        : availableDoctors.length === 0 && selectedDate
                          ? t("patient.homeVisitBooking.noDoctorsAvailable")
                          : t("patient.homeVisitBooking.selectDoctor")}
                    </option>
                    {availableDoctors.map((doc) => (
                      <option key={doc.doctor_id} value={doc.doctor_id}>
                        {doc.name} {doc.specialization ? `- ${doc.specialization}` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="relative z-50">
                  <Label htmlFor="time-select">{t("patient.homeVisitBooking.timeLabel")} <span className="text-destructive">*</span></Label>
                  <select
                    id="time-select"
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring mt-1"
                    required
                  >
                    <option value="">
                      {loadingTimes
                        ? t("patient.homeVisitBooking.loadingTimes")
                        : availableTimes.length === 0 && selectedDoctor
                          ? t("patient.homeVisitBooking.noSchedule")
                          : t("patient.homeVisitBooking.selectTime")}
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
                  {t("patient.homeVisitBooking.patientInfo")}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="patient-name">{t("patient.homeVisitBooking.fullName")} <span className="text-destructive">*</span></Label>
                  <Input
                    id="patient-name"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder={t("patient.homeVisitBooking.fullNamePlaceholder")}
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone-number">{t("patient.homeVisitBooking.phoneNumber")} <span className="text-destructive">*</span></Label>
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
                  {t("patient.homeVisitBooking.addressComplaint")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="address">{t("patient.homeVisitBooking.fullAddress")} <span className="text-destructive">*</span></Label>
                  <Textarea
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder={t("patient.homeVisitBooking.addressPlaceholder")}
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="complaint">{t("patient.homeVisitBooking.complaintLabel")} <span className="text-destructive">*</span></Label>
                  <Textarea
                    id="complaint"
                    value={complaint}
                    onChange={(e) => setComplaint(e.target.value)}
                    placeholder={t("patient.homeVisitBooking.complaintPlaceholder")}
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
                <CardTitle>{t("patient.homeVisitBooking.summary")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between font-medium text-primary border-b pb-2">
                  <span>{t("patient.homeVisitBooking.doctorLabel")}</span>
                  <span className="text-right">
                    {selectedDoctorData
                      ? `${selectedDoctorData.name}${selectedDoctorData.specialization ? `, ${selectedDoctorData.specialization}` : ""}`
                      : "-"}
                  </span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span>{t("common.patient")}</span>
                  <span className="text-right">{patientName || "-"}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span>{t("common.date")}</span>
                  <span className="text-right">{selectedDate ? `${selectedDate} (${selectedHari})` : "-"}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span>{t("common.time")}</span>
                  <span className="text-right">{selectedTime || "-"}</span>
                </div>
                <div className="flex justify-between border-b pb-2 flex-col gap-1">
                  <span>{t("common.address")}:</span>
                  <span className="text-muted-foreground whitespace-pre-wrap">{address || "-"}</span>
                </div>
                <div className="flex justify-between flex-col gap-1">
                  <span>{t("common.complaint")}:</span>
                  <span className="text-muted-foreground whitespace-pre-wrap">{complaint || "-"}</span>
                </div>
                <div className="pt-4">
                  <Button
                    type="submit"
                    className="w-full medical-gradient text-primary-foreground"
                    disabled={!isFormValid || loading}
                  >
                    {loading ? t("patient.homeVisitBooking.sending") : t("patient.homeVisitBooking.confirmAndBook")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
