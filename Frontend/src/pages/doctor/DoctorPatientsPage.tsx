import { useState, useEffect, useMemo } from "react";
import {
  Users, MessageSquare, Home, Clock, Search, Filter,
  Loader2, ChevronRight, User, Calendar, MapPin,
  FileText, Activity, X, ArrowUpDown, RefreshCw
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import StatCard from "@/components/StatCard";
import api from "@/services/api";
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
        {/* Back button */}
        <Button
          variant="ghost"
          onClick={() => setSelectedPatient(null)}
          className="gap-2 text-muted-foreground hover:text-foreground -ml-2"
        >
          ← Kembali ke Daftar Pasien
        </Button>

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
