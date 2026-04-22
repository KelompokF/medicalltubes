import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Home, Calendar, MapPin, Search, Filter, Eye,
  CheckCircle, XCircle, Loader2, Clock, Phone, FileText, Stethoscope
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import EmptyState from "@/components/EmptyState";
import { toast } from "sonner";
import api from "@/services/api";

// Tipe data permintaan home visit sesuai schema backend
  id: string;
  user_id: string;
  doctor_id?: string;
  doctor_name?: string;
  patient_name: string;
  address: string;
  phone_number: string;
  complaint: string;
  preferred_date: string;
  preferred_time?: string;
  status: "pending" | "approved" | "rejected" | "completed";
  created_at: string;
}

// Konfigurasi tampilan badge untuk setiap status
const statusConfig: Record<
  HomeVisitRequest["status"],
  { label: string; color: string; icon: React.ElementType }
> = {
  completed: {
    label: "Selesai",
    color: "bg-success/10 text-success border-success/20",
    icon: CheckCircle,
  },
  approved: {
    label: "Disetujui",
    color: "bg-primary/10 text-primary border-primary/20",
    icon: Clock,
  },
  pending: {
    label: "Menunggu",
    color: "bg-warning/10 text-warning border-warning/20",
    icon: Loader2,
  },
  rejected: {
    label: "Ditolak",
    color: "bg-destructive/10 text-destructive border-destructive/20",
    icon: XCircle,
  },
};

// Format tanggal ISO ke string yang mudah dibaca
function formatDate(isoStr: string) {
  return new Date(isoStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function HomeVisitHistoryPage() {
  const [visits, setVisits] = useState<HomeVisitRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  /** Ambil daftar home visit milik user yang login dari GET /home-visit/ */
  useEffect(() => {
    const fetchVisits = async () => {
      setIsLoading(true);
      try {
        const response = await api.get("/home-visit/");
        setVisits(response.data);
      } catch (err: any) {
        toast.error("Gagal memuat riwayat kunjungan rumah");
      } finally {
        setIsLoading(false);
      }
    };
    fetchVisits();
  }, []);

  // Filter berdasarkan pencarian dan status
  const filtered = visits.filter((visit) => {
    const matchesSearch =
      visit.patient_name.toLowerCase().includes(search.toLowerCase()) ||
      visit.address.toLowerCase().includes(search.toLowerCase()) ||
      visit.complaint.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || visit.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Riwayat Kunjungan Rumah</h1>
          <p className="text-muted-foreground mt-1">
            Lihat dan pantau semua permintaan kunjungan rumah Anda.
          </p>
        </div>
        <Button className="medical-gradient text-primary-foreground" onClick={() => window.location.href = "/"}>
          Pesan Kunjungan Baru
        </Button>
      </div>

      {/* Filter pencarian dan status */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari berdasarkan nama, alamat, atau keluhan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="pending">Menunggu</SelectItem>
            <SelectItem value="approved">Disetujui</SelectItem>
            <SelectItem value="completed">Selesai</SelectItem>
            <SelectItem value="rejected">Ditolak</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Statistik ringkasan */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total", value: visits.length, color: "bg-primary/10 text-primary" },
          { label: "Selesai", value: visits.filter((v) => v.status === "completed").length, color: "bg-success/10 text-success" },
          { label: "Menunggu/Disetujui", value: visits.filter((v) => v.status === "pending" || v.status === "approved").length, color: "bg-warning/10 text-warning" },
          { label: "Ditolak", value: visits.filter((v) => v.status === "rejected").length, color: "bg-destructive/10 text-destructive" },
        ].map((stat) => (
          <div key={stat.label} className={`rounded-xl p-4 ${stat.color}`}>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-xs font-medium opacity-80">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Daftar kunjungan */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Tidak ada kunjungan ditemukan"
          description={
            visits.length === 0
              ? "Anda belum memiliki permintaan kunjungan rumah."
              : "Coba ubah filter atau kata kunci pencarian Anda."
          }
          icon={<Home className="h-8 w-8 text-muted-foreground" />}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((visit) => {
            const config = statusConfig[visit.status];
            const StatusIcon = config.icon;
            return (
              <Card
                key={visit.id}
                className="shadow-card hover:shadow-md transition-shadow"
              >
                <CardContent className="p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      {/* Avatar inisial */}
                      <div className="hidden sm:flex h-12 w-12 rounded-full medical-gradient items-center justify-center text-primary-foreground font-bold text-sm shrink-0">
                        {visit.patient_name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>

                      <div className="space-y-1.5">
                        {/* Nama dan status */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="flex flex-col">
                            <h3 className="font-semibold text-foreground">
                              {visit.patient_name}
                            </h3>
                            {visit.doctor_name && (
                              <p className="text-[10px] text-primary flex items-center gap-1">
                                <Stethoscope className="h-3 w-3" />
                                Dokter: {visit.doctor_name}
                              </p>
                            )}
                          </div>
                          <Badge variant="outline" className={config.color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {config.label}
                          </Badge>
                        </div>

                        {/* Detail kunjungan */}
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(visit.preferred_date)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {visit.preferred_time || "--:--"}
                          </span>
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {visit.phone_number}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {visit.address}
                          </span>
                        </div>

                        {/* Keluhan */}
                        {visit.complaint && (
                          <p className="text-xs text-muted-foreground/70 italic flex items-start gap-1">
                            <FileText className="h-3 w-3 mt-0.5 shrink-0" />
                            "{visit.complaint}"
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Tombol aksi */}
                    <div className="flex gap-2 shrink-0">
                      {(visit.status === "approved" || visit.status === "pending") && (
                        <Button variant="outline" size="sm" asChild>
                          <Link to="/tracking">Pantau</Link>
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/home-visit-detail/${visit.id}`}>
                          <Eye className="h-4 w-4 mr-1" /> Detail
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
