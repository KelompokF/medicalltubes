import { useState, useEffect, useMemo } from "react";
import {
  Users, MessageSquare, Home, Clock, Search, Filter,
  Loader2, ChevronRight, User, Calendar, MapPin,
  FileText, Activity, X, ArrowUpDown, RefreshCw,
  Stethoscope, Droplets, CalendarDays, ClipboardList, Pill, AlertTriangle, Heart
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import StatCard from "@/components/StatCard";
import api, { doctorService } from "@/services/api";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────
interface PatientSummary {
  patient_id: string;
  patient_name: string;
  total_consultations: number;
  total_home_visits: number;
  last_interaction: string;
  last_type: string;
}

interface PatientHistoryItem {
  id: string;
  patient_id: string;
  patient_name: string;
  type: "consultation" | "home_visit";
  status: string;
  date: string;
  time: string;
  notes?: string;
  address?: string;
  complaint?: string;
}

interface DoctorPatientsData {
  patients: PatientSummary[];
  history: PatientHistoryItem[];
  total_patients: number;
  total_consultations: number;
  total_home_visits: number;
}

// ─── Helpers ─────────────────────────────────
const statusConfig: Record<string, { label: string; className: string }> = {
  Aktif:     { label: "Aktif",      className: "bg-emerald-500/15 text-emerald-600 border-emerald-500/25 hover:bg-emerald-500/20" },
  Selesai:   { label: "Selesai",    className: "bg-sky-500/15 text-sky-600 border-sky-500/25 hover:bg-sky-500/20" },
  pending:   { label: "Menunggu",   className: "bg-amber-500/15 text-amber-600 border-amber-500/25 hover:bg-amber-500/20" },
  approved:  { label: "Diterima",   className: "bg-emerald-500/15 text-emerald-600 border-emerald-500/25 hover:bg-emerald-500/20" },
  rejected:  { label: "Ditolak",    className: "bg-rose-500/15 text-rose-600 border-rose-500/25 hover:bg-rose-500/20" },
  completed: { label: "Selesai",    className: "bg-sky-500/15 text-sky-600 border-sky-500/25 hover:bg-sky-500/20" },
  cancelled: { label: "Dibatalkan", className: "bg-zinc-500/15 text-zinc-500 border-zinc-500/25 hover:bg-zinc-500/20" },
  confirmed: { label: "Terkonfirmasi", className: "bg-emerald-500/15 text-emerald-600 border-emerald-500/25 hover:bg-emerald-500/20" },
  on_the_way:{ label: "Dalam Perjalanan", className: "bg-indigo-500/15 text-indigo-600 border-indigo-500/25 hover:bg-indigo-500/20" },
  arrived:   { label: "Tiba",       className: "bg-teal-500/15 text-teal-600 border-teal-500/25 hover:bg-teal-500/20" },
};

function getStatusBadge(status: string) {
  const config = statusConfig[status] || {
    label: status,
    className: "bg-zinc-500/15 text-zinc-500 border-zinc-500/25",
  };
  return (
    <Badge variant="outline" className={`text-[11px] font-semibold transition-colors ${config.className}`}>
      {config.label}
    </Badge>
  );
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter((n) => n.length > 0)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// ─── Component ───────────────────────────────
export default function DoctorPatientsPage() {
  const [data, setData] = useState<DoctorPatientsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "consultation" | "home_visit">("all");
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("patients");

  // New Patient Info State
  const [isPatientInfoModalOpen, setIsPatientInfoModalOpen] = useState(false);
  const [patientSummary, setPatientSummary] = useState<any>(null);
  const [isLoadingPatientInfo, setIsLoadingPatientInfo] = useState(false);
  const [patientInfoTab, setPatientInfoTab] = useState<"overview" | "records">("overview");

  const fetchPatientInfo = async (patientId: string) => {
    setIsLoadingPatientInfo(true);
    try {
      const res = await doctorService.getPatientSummary(patientId);
      setPatientSummary(res.data);
    } catch (err) {
      toast.error("Gagal memuat info pasien");
    } finally {
      setIsLoadingPatientInfo(false);
    }
  };

  const handleOpenPatientInfo = () => {
    if (!selectedPatient) return;
    setIsPatientInfoModalOpen(true);
    setPatientInfoTab("overview");
    fetchPatientInfo(selectedPatient);
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/doctor/patients");
      setData(res.data);
    } catch (err: any) {
      console.error("Failed to load patients:", err);
      setError("Gagal memuat data pasien. Silakan coba lagi.");
      toast.error("Gagal memuat data pasien");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered patients
  const filteredPatients = useMemo(() => {
    if (!data) return [];
    let patients = data.patients;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      patients = patients.filter((p) =>
        p.patient_name.toLowerCase().includes(q)
      );
    }

    if (filterType === "consultation") {
      patients = patients.filter((p) => p.total_consultations > 0);
    } else if (filterType === "home_visit") {
      patients = patients.filter((p) => p.total_home_visits > 0);
    }

    return patients;
  }, [data, searchQuery, filterType]);

  // Filtered history
  const filteredHistory = useMemo(() => {
    if (!data) return [];
    let history = data.history;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      history = history.filter((h) =>
        h.patient_name.toLowerCase().includes(q)
      );
    }

    if (filterType !== "all") {
      history = history.filter((h) => h.type === filterType);
    }

    if (selectedPatient) {
      history = history.filter((h) => h.patient_id === selectedPatient);
    }

    return history;
  }, [data, searchQuery, filterType, selectedPatient]);

  // Patient detail view
  const selectedPatientData = useMemo(() => {
    if (!selectedPatient || !data) return null;
    return data.patients.find((p) => p.patient_id === selectedPatient) || null;
  }, [selectedPatient, data]);

  const selectedPatientHistory = useMemo(() => {
    if (!selectedPatient || !data) return [];
    return data.history.filter((h) => h.patient_id === selectedPatient);
  }, [selectedPatient, data]);

  // ─── Loading State ──────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 animate-fade-in">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
          <div className="relative rounded-full bg-primary/10 p-6">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
        </div>
        <p className="text-muted-foreground mt-6 text-sm font-medium">Memuat data pasien...</p>
      </div>
    );
  }

  // ─── Error State ────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-32 animate-fade-in">
        <div className="rounded-full bg-destructive/10 p-6 mb-4">
          <X className="h-8 w-8 text-destructive" />
        </div>
        <p className="text-foreground font-semibold mb-2">Terjadi Kesalahan</p>
        <p className="text-muted-foreground text-sm mb-4">{error}</p>
        <Button variant="outline" onClick={loadData} className="gap-2">
          <RefreshCw className="h-4 w-4" /> Coba Lagi
        </Button>
      </div>
    );
  }

  if (!data) return null;

  // ─── Patient Detail Panel ──────────
  if (selectedPatient && selectedPatientData) {
    return (
      <div className="space-y-6 animate-fade-in">
        {/* Back button and Info Button */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between -ml-2 mb-2 gap-3">
          <Button
            variant="ghost"
            onClick={() => setSelectedPatient(null)}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            ← Kembali ke Daftar Pasien
          </Button>
          <Button 
            variant="outline" 
            className="gap-2 text-blue-600 border-blue-200 hover:bg-blue-50 dark:border-blue-800 dark:hover:bg-blue-950 sm:mr-4"
            onClick={handleOpenPatientInfo}
          >
            <Activity className="h-4 w-4" />
            Lihat Rekam Medis
          </Button>
        </div>

        {/* Patient Header Card */}
        <div className="relative overflow-hidden rounded-2xl border bg-card shadow-card">
          <div className="absolute top-0 left-0 right-0 h-24 medical-gradient opacity-90" />
          <div className="relative p-6 pt-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
              <div className="h-16 w-16 rounded-2xl bg-white/20 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                {getInitials(selectedPatientData.patient_name)}
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-white drop-shadow-sm">
                  {selectedPatientData.patient_name}
                </h1>
                <p className="text-white/80 text-sm mt-1">
                  Terakhir interaksi: {selectedPatientData.last_interaction}
                </p>
              </div>
            </div>
          </div>

          <div className="px-6 pb-6 pt-2 grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="rounded-xl bg-primary/5 border border-primary/10 p-4 text-center">
              <p className="text-2xl font-bold text-primary">{selectedPatientData.total_consultations + selectedPatientData.total_home_visits}</p>
              <p className="text-xs text-muted-foreground font-medium mt-1">Total Kunjungan</p>
            </div>
            <div className="rounded-xl bg-sky-500/5 border border-sky-500/10 p-4 text-center">
              <p className="text-2xl font-bold text-sky-600">{selectedPatientData.total_consultations}</p>
              <p className="text-xs text-muted-foreground font-medium mt-1">Konsultasi</p>
            </div>
            <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/10 p-4 text-center col-span-2 sm:col-span-1">
              <p className="text-2xl font-bold text-emerald-600">{selectedPatientData.total_home_visits}</p>
              <p className="text-xs text-muted-foreground font-medium mt-1">Home Visit</p>
            </div>
          </div>
        </div>

        {/* Patient History */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="h-5 w-5 text-primary" />
              Riwayat Lengkap
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedPatientHistory.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-8 w-8 mx-auto mb-3 opacity-40" />
                <p className="text-sm">Belum ada riwayat.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedPatientHistory.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-4 p-4 rounded-xl border bg-muted/20 hover:bg-muted/40 transition-colors"
                  >
                    <div className={`shrink-0 rounded-lg p-2.5 ${
                      item.type === "consultation"
                        ? "bg-sky-500/10 text-sky-600"
                        : "bg-emerald-500/10 text-emerald-600"
                    }`}>
                      {item.type === "consultation" ? (
                        <MessageSquare className="h-4 w-4" />
                      ) : (
                        <Home className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="font-medium text-sm text-foreground">
                          {item.type === "consultation" ? "Konsultasi Online" : "Kunjungan Rumah"}
                        </span>
                        {getStatusBadge(item.status)}
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {item.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {item.time}
                        </span>
                      </div>
                      {item.complaint && (
                        <p className="text-xs text-muted-foreground mt-2 bg-muted/50 p-2 rounded-md">
                          <span className="font-medium">Keluhan:</span> {item.complaint}
                        </p>
                      )}
                      {item.address && (
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <MapPin className="h-3 w-3 shrink-0" />
                          {item.address}
                        </p>
                      )}
                      {item.notes && (
                        <p className="text-xs text-muted-foreground mt-1 italic">
                          Catatan: {item.notes}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Patient Info Modal */}
        <Dialog open={isPatientInfoModalOpen} onOpenChange={setIsPatientInfoModalOpen}>
          <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader className="pb-3 border-b">
              <DialogTitle className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-blue-600" />
                Rekam Medis Pasien
              </DialogTitle>
              <DialogDescription>
                {patientSummary?.profile?.full_name
                  ? `Data kesehatan milik ${patientSummary.profile.full_name}`
                  : "Data kesehatan pasien untuk membantu diagnosis yang lebih tepat."}
              </DialogDescription>
            </DialogHeader>

            {isLoadingPatientInfo ? (
              <div className="flex justify-center items-center py-16">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                  <p className="text-sm text-muted-foreground">Memuat data pasien...</p>
                </div>
              </div>
            ) : patientSummary ? (
              <div className="flex flex-col flex-1 overflow-hidden">
                {/* TAB NAVIGATION */}
                <div className="flex border-b my-3">
                  <button
                    onClick={() => setPatientInfoTab("overview")}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      patientInfoTab === "overview"
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Ringkasan
                  </button>
                  <button
                    onClick={() => setPatientInfoTab("records")}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
                      patientInfoTab === "records"
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Riwayat Rekam Medis
                    {patientSummary.total_records > 0 && (
                      <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        {patientSummary.total_records}
                      </span>
                    )}
                  </button>
                </div>

                <div className="overflow-y-auto flex-1 pr-1">
                  {patientInfoTab === "overview" && (
                    <div className="space-y-4">
                      {/* Profil Dasar */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-lg bg-muted/30 border">
                          <span className="text-xs text-muted-foreground flex items-center gap-1 mb-1"><User className="h-3 w-3" />Nama Lengkap</span>
                          <p className="font-semibold text-sm">{patientSummary.profile.full_name || '-'}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/30 border">
                          <span className="text-xs text-muted-foreground flex items-center gap-1 mb-1"><Droplets className="h-3 w-3" />Golongan Darah</span>
                          <p className="font-semibold text-sm">{patientSummary.profile.blood_type || <span className="text-muted-foreground italic font-normal">Belum diisi</span>}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/30 border">
                          <span className="text-xs text-muted-foreground flex items-center gap-1 mb-1"><CalendarDays className="h-3 w-3" />Tanggal Lahir</span>
                          <p className="font-semibold text-sm">
                            {patientSummary.profile.date_of_birth
                              ? new Date(patientSummary.profile.date_of_birth).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                              : <span className="text-muted-foreground italic font-normal">Belum diisi</span>}
                          </p>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/30 border">
                          <span className="text-xs text-muted-foreground flex items-center gap-1 mb-1"><ClipboardList className="h-3 w-3" />Total Rekam Medis</span>
                          <p className="font-semibold text-sm">{patientSummary.total_records} catatan</p>
                        </div>
                      </div>

                      {/* ALERGI — ditampilkan menonjol */}
                      {patientSummary.latest_allergies ? (
                        <div className="p-4 rounded-lg bg-red-50 border border-red-200 dark:bg-red-950/30 dark:border-red-800">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                            <span className="font-semibold text-red-700 dark:text-red-400 text-sm">PERINGATAN ALERGI</span>
                          </div>
                          <p className="text-red-800 dark:text-red-300 font-medium text-sm">{patientSummary.latest_allergies}</p>
                        </div>
                      ) : (
                        <div className="p-3 rounded-lg bg-green-50 border border-green-200 dark:bg-green-950/30 dark:border-green-800 flex items-center gap-2">
                          <Heart className="h-4 w-4 text-green-600" />
                          <span className="text-green-700 dark:text-green-400 text-sm font-medium">Tidak ada riwayat alergi yang tercatat</span>
                        </div>
                      )}

                      {/* Kondisi & Obat Terkini */}
                      <div className="grid grid-cols-1 gap-3">
                        <div className="p-3 rounded-lg border bg-muted/20">
                          <span className="text-xs text-muted-foreground flex items-center gap-1 mb-1"><Stethoscope className="h-3 w-3" />Kondisi/Penyakit Terkini</span>
                          <p className="text-sm font-medium">{patientSummary.latest_conditions || <span className="italic text-muted-foreground font-normal">Tidak ada data</span>}</p>
                        </div>
                        <div className="p-3 rounded-lg border bg-muted/20">
                          <span className="text-xs text-muted-foreground flex items-center gap-1 mb-1"><Pill className="h-3 w-3" />Obat yang Sedang Dikonsumsi</span>
                          <p className="text-sm font-medium">{patientSummary.latest_medications || <span className="italic text-muted-foreground font-normal">Tidak ada data</span>}</p>
                        </div>
                      </div>

                      {/* Tanda Vital Terkini */}
                      {patientSummary.latest_vitals && (
                        <div className="space-y-2">
                          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Tanda Vital Terakhir</p>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {patientSummary.latest_vitals.blood_pressure && (
                              <div className="p-2.5 rounded-lg border bg-blue-50 dark:bg-blue-950/20 text-center">
                                <p className="text-[10px] text-muted-foreground mb-0.5">Tekanan Darah</p>
                                <p className="font-bold text-sm text-blue-700 dark:text-blue-400">{patientSummary.latest_vitals.blood_pressure}</p>
                              </div>
                            )}
                            {patientSummary.latest_vitals.heart_rate && (
                              <div className="p-2.5 rounded-lg border bg-red-50 dark:bg-red-950/20 text-center">
                                <p className="text-[10px] text-muted-foreground mb-0.5">Detak Jantung</p>
                                <p className="font-bold text-sm text-red-700 dark:text-red-400">{patientSummary.latest_vitals.heart_rate} bpm</p>
                              </div>
                            )}
                            {patientSummary.latest_vitals.weight && (
                              <div className="p-2.5 rounded-lg border bg-orange-50 dark:bg-orange-950/20 text-center">
                                <p className="text-[10px] text-muted-foreground mb-0.5">Berat Badan</p>
                                <p className="font-bold text-sm text-orange-700 dark:text-orange-400">{patientSummary.latest_vitals.weight} kg</p>
                              </div>
                            )}
                            {patientSummary.latest_vitals.height && (
                              <div className="p-2.5 rounded-lg border bg-purple-50 dark:bg-purple-950/20 text-center">
                                <p className="text-[10px] text-muted-foreground mb-0.5">Tinggi Badan</p>
                                <p className="font-bold text-sm text-purple-700 dark:text-purple-400">{patientSummary.latest_vitals.height} cm</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {patientInfoTab === "records" && (
                    <div className="space-y-3">
                      {patientSummary.health_records.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                          <ClipboardList className="h-12 w-12 text-muted-foreground/30 mb-3" />
                          <p className="text-sm font-medium text-muted-foreground">Belum ada rekam medis</p>
                          <p className="text-xs text-muted-foreground/70 mt-1">Pasien belum menambahkan catatan kesehatan apapun.</p>
                        </div>
                      ) : (
                        patientSummary.health_records.map((record: any, idx: number) => (
                          <div key={idx} className="p-4 rounded-lg border bg-card space-y-3">
                            <div className="flex items-center justify-between">
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                {new Date(record.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                              </Badge>
                              {idx === 0 && <Badge className="bg-green-100 text-green-700 border-0 text-[10px]">Terbaru</Badge>}
                            </div>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                              <div>
                                <p className="text-[11px] text-muted-foreground mb-0.5">Diagnosa/Kondisi</p>
                                <p className="font-medium text-sm">{record.diagnosed_conditions || <span className="text-muted-foreground italic font-normal">-</span>}</p>
                              </div>
                              <div>
                                <p className="text-[11px] text-muted-foreground mb-0.5">Alergi</p>
                                <p className={`font-medium text-sm ${record.allergies ? 'text-red-600' : 'text-muted-foreground italic font-normal'}`}>{record.allergies || '-'}</p>
                              </div>
                              <div>
                                <p className="text-[11px] text-muted-foreground mb-0.5">Obat Dikonsumsi</p>
                                <p className="font-medium text-sm">{record.current_medications || <span className="text-muted-foreground italic font-normal">-</span>}</p>
                              </div>
                              <div>
                                <p className="text-[11px] text-muted-foreground mb-0.5">Catatan</p>
                                <p className="font-medium text-sm">{record.notes || <span className="text-muted-foreground italic font-normal">-</span>}</p>
                              </div>
                            </div>
                            {(record.blood_pressure || record.heart_rate || record.weight || record.height) && (
                              <div className="grid grid-cols-4 gap-2 pt-2 border-t">
                                {record.blood_pressure && <div className="text-center"><p className="text-[10px] text-muted-foreground">Tensi</p><p className="text-xs font-bold">{record.blood_pressure}</p></div>}
                                {record.heart_rate && <div className="text-center"><p className="text-[10px] text-muted-foreground">Nadi</p><p className="text-xs font-bold">{record.heart_rate} bpm</p></div>}
                                {record.weight && <div className="text-center"><p className="text-[10px] text-muted-foreground">BB</p><p className="text-xs font-bold">{record.weight} kg</p></div>}
                                {record.height && <div className="text-center"><p className="text-[10px] text-muted-foreground">TB</p><p className="text-xs font-bold">{record.height} cm</p></div>}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <User className="h-12 w-12 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">Data pasien tidak tersedia</p>
              </div>
            )}

            <DialogFooter className="pt-3 border-t mt-3">
              <Button variant="outline" onClick={() => setIsPatientInfoModalOpen(false)}>Tutup</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ─── Main View ─────────────────────
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-background p-6 rounded-2xl shadow-sm border">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Riwayat Pasien</h1>
          <p className="text-muted-foreground mt-1">
            Daftar pasien yang telah melakukan konsultasi dan home visit
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadData} className="flex items-center gap-2 w-fit">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Pasien"
          value={data.total_patients}
          icon={Users}
          variant="primary"
        />
        <StatCard
          title="Total Konsultasi"
          value={data.total_consultations}
          icon={MessageSquare}
          variant="success"
        />
        <StatCard
          title="Total Home Visit"
          value={data.total_home_visits}
          icon={Home}
          variant="warning"
        />
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama pasien..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            id="search-patients"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
          <div className="flex rounded-lg border overflow-hidden">
            {[
              { key: "all" as const, label: "Semua" },
              { key: "consultation" as const, label: "Konsultasi" },
              { key: "home_visit" as const, label: "Home Visit" },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilterType(key)}
                className={`px-3 py-2 text-xs font-medium transition-colors ${
                  filterType === key
                    ? "bg-primary text-primary-foreground"
                    : "bg-background text-muted-foreground hover:bg-muted"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="patients" className="gap-2">
            <Users className="h-4 w-4" />
            Daftar Pasien
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <Clock className="h-4 w-4" />
            Semua Riwayat
          </TabsTrigger>
        </TabsList>

        {/* ─── Tab: Daftar Pasien ─── */}
        <TabsContent value="patients" className="mt-4">
          {filteredPatients.length === 0 ? (
            <Card className="shadow-card">
              <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <h3 className="font-semibold text-foreground">Belum ada pasien</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {searchQuery
                      ? "Tidak ditemukan pasien dengan pencarian tersebut."
                      : "Pasien yang pernah melakukan konsultasi atau home visit akan muncul di sini."}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredPatients.map((patient) => (
                <Card
                  key={patient.patient_id}
                  className="shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-0.5 cursor-pointer group border-l-4 border-l-transparent hover:border-l-primary"
                  onClick={() => {
                    setSelectedPatient(patient.patient_id);
                  }}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary text-sm font-bold shrink-0 border border-primary/10 group-hover:scale-105 transition-transform">
                        {getInitials(patient.patient_name)}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                            {patient.patient_name}
                          </h3>
                          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0 transition-colors" />
                        </div>

                        <div className="flex items-center gap-3 mt-2">
                          {patient.total_consultations > 0 && (
                            <span className="inline-flex items-center gap-1 text-xs bg-sky-500/10 text-sky-600 px-2 py-0.5 rounded-full font-medium">
                              <MessageSquare className="h-3 w-3" />
                              {patient.total_consultations} Konsultasi
                            </span>
                          )}
                          {patient.total_home_visits > 0 && (
                            <span className="inline-flex items-center gap-1 text-xs bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full font-medium">
                              <Home className="h-3 w-3" />
                              {patient.total_home_visits} Home Visit
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 mt-2.5 text-[11px] text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>Terakhir: {patient.last_interaction}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ─── Tab: Semua Riwayat ─── */}
        <TabsContent value="history" className="mt-4">
          {filteredHistory.length === 0 ? (
            <Card className="shadow-card">
              <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                  <Clock className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <h3 className="font-semibold text-foreground">Belum ada riwayat</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {searchQuery
                      ? "Tidak ditemukan riwayat dengan pencarian tersebut."
                      : "Riwayat konsultasi dan home visit akan muncul di sini."}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-card overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">Pasien</TableHead>
                      <TableHead className="font-semibold">Tipe</TableHead>
                      <TableHead className="font-semibold">Tanggal</TableHead>
                      <TableHead className="font-semibold">Waktu</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold">Detail</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredHistory.map((item) => (
                      <TableRow
                        key={item.id}
                        className="hover:bg-muted/30 transition-colors cursor-pointer"
                        onClick={() => setSelectedPatient(item.patient_id)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary text-xs font-bold shrink-0 border border-primary/10">
                              {getInitials(item.patient_name)}
                            </div>
                            <span className="font-medium text-sm">{item.patient_name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                            item.type === "consultation"
                              ? "bg-sky-500/10 text-sky-600"
                              : "bg-emerald-500/10 text-emerald-600"
                          }`}>
                            {item.type === "consultation" ? (
                              <><MessageSquare className="h-3 w-3" /> Konsultasi</>
                            ) : (
                              <><Home className="h-3 w-3" /> Home Visit</>
                            )}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3 w-3" />
                            {item.date}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {item.time}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(item.status)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs text-primary hover:text-primary hover:bg-primary/5 gap-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPatient(item.patient_id);
                            }}
                          >
                            Lihat <ChevronRight className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
