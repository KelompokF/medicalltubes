import { useState, useEffect } from "react";
import {
  Calendar, Clock, MapPin, Phone, User, Stethoscope,
  FileText, CheckCircle2, XCircle, AlertCircle, Loader2,
  ChevronRight, Home, RefreshCw, X
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";

// ─── Types ─────────────────────────────────────────────────────────────────
interface HomeVisitRequest {
  id: string;
  patient_name: string;
  doctor_id: string | null;
  doctor_name: string;
  specialization: string;
  address: string;
  phone_number: string;
  complaint: string;
  preferred_date: string;
  preferred_time: string;
  status: string;
  notes: string;
  created_at: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────
const statusLabel: Record<string, string> = {
  pending:   "Menunggu Konfirmasi",
  approved:  "Diterima Dokter",
  rejected:  "Ditolak",
  completed: "Selesai",
  cancelled: "Dibatalkan",
};

const statusVariant: Record<string, string> = {
  pending:   "bg-yellow-100 text-yellow-800 border-yellow-200",
  approved:  "bg-green-100  text-green-800  border-green-200",
  rejected:  "bg-red-100    text-red-800    border-red-200",
  completed: "bg-blue-100   text-blue-800   border-blue-200",
  cancelled: "bg-gray-100   text-gray-600   border-gray-200",
};

const StatusIcon: Record<string, any> = {
  pending:   AlertCircle,
  approved:  CheckCircle2,
  rejected:  XCircle,
  completed: CheckCircle2,
  cancelled: XCircle,
};

const formatDate = (dateStr: string): string => {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
  } catch {
    return dateStr;
  }
};

const formatDateTime = (dtStr: string): string => {
  if (!dtStr) return "-";
  try {
    const d = new Date(dtStr);
    return d.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return dtStr;
  }
};

// ─── Detail Modal ────────────────────────────────────────────────────────────
function DetailModal({ request, onClose }: { request: HomeVisitRequest; onClose: () => void }) {
  const status = request.status || "pending";
  const SIcon = StatusIcon[status] || AlertCircle;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-background rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-foreground">Detail Pengajuan</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Diajukan: {formatDateTime(request.created_at)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Status Banner */}
        <div className={`mx-6 mt-4 flex items-center gap-2 rounded-xl border px-4 py-3 ${statusVariant[status] || statusVariant.pending}`}>
          <SIcon className="h-5 w-5 shrink-0" />
          <span className="font-semibold">{statusLabel[status] || status}</span>
        </div>

        {/* Detail Fields */}
        <div className="p-6 space-y-4">
          <DetailRow icon={<User className="h-4 w-4" />} label="Nama Pasien" value={request.patient_name} />
          <DetailRow icon={<Phone className="h-4 w-4" />} label="Nomor Telepon" value={request.phone_number} />
          <DetailRow icon={<Stethoscope className="h-4 w-4" />} label="Dokter"
            value={`${request.doctor_name}${request.specialization ? `, ${request.specialization}` : ""}`} />
          <DetailRow icon={<Calendar className="h-4 w-4" />} label="Tanggal Kunjungan"
            value={formatDate(request.preferred_date)} />
          <DetailRow icon={<Clock className="h-4 w-4" />} label="Jam Kunjungan" value={request.preferred_time || "-"} />
          <DetailRow icon={<MapPin className="h-4 w-4" />} label="Alamat" value={request.address} multiline />
          <DetailRow icon={<FileText className="h-4 w-4" />} label="Keluhan" value={request.complaint} multiline />
          {request.notes && (
            <DetailRow icon={<FileText className="h-4 w-4" />} label="Catatan Dokter / Admin" value={request.notes} multiline />
          )}
        </div>

        <div className="p-6 pt-0">
          <Button className="w-full" onClick={onClose}>Tutup</Button>
        </div>
      </div>
    </div>
  );
}

function DetailRow({
  icon, label, value, multiline = false,
}: { icon: React.ReactNode; label: string; value: string; multiline?: boolean }) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 text-muted-foreground shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
        <p className={`text-sm text-foreground mt-0.5 ${multiline ? "whitespace-pre-wrap" : ""}`}>
          {value || "-"}
        </p>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function HomeVisitTrackingPage() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<HomeVisitRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<HomeVisitRequest | null>(null);

  const loadRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/home-visits/my-requests");
      setRequests(res.data || []);
    } catch (err: any) {
      console.error(err);
      setError("Gagal memuat data. Pastikan Anda sudah login.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tracking Home Visit</h1>
          <p className="text-muted-foreground mt-1">Pantau status pengajuan kunjungan rumah Anda</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadRequests} className="flex items-center gap-2 w-fit">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-destructive flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && requests.length === 0 && (
        <Card className="shadow-card">
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
              <Home className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-foreground">Belum ada pengajuan Home Visit</h3>
              <p className="text-sm text-muted-foreground mt-1">Anda belum pernah mengajukan permintaan kunjungan rumah.</p>
            </div>
            <Button
              className="medical-gradient text-primary-foreground"
              onClick={() => navigate("/home-visit")}
            >
              Ajukan Sekarang
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Request List */}
      {!loading && requests.length > 0 && (
        <div className="space-y-4">
          {requests.map((item) => {
            const status = item.status || "pending";
            const SIcon = StatusIcon[status] || AlertCircle;
            return (
              <Card key={item.id} className="shadow-card hover:shadow-md transition-shadow border-l-4"
                style={{ borderLeftColor: status === "approved" ? "#16a34a" : status === "rejected" ? "#dc2626" : status === "completed" ? "#2563eb" : status === "cancelled" ? "#9ca3af" : "#ca8a04" }}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    {/* Left info */}
                    <div className="flex-1 min-w-0 space-y-2">
                      {/* Doctor name */}
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full medical-gradient flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0">
                          {item.doctor_name?.replace("Dr. ", "").split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "DR"}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground text-sm">{item.doctor_name}</p>
                          {item.specialization && (
                            <p className="text-xs text-muted-foreground">{item.specialization}</p>
                          )}
                        </div>
                      </div>

                      {/* Date & Time */}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(item.preferred_date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {item.preferred_time}
                        </span>
                      </div>

                      {/* Patient & Complaint */}
                      <div className="text-xs text-muted-foreground space-y-0.5">
                        <p><span className="font-medium">Pasien:</span> {item.patient_name}</p>
                        <p className="truncate"><span className="font-medium">Keluhan:</span> {item.complaint}</p>
                      </div>
                    </div>

                    {/* Right: Badge + Button */}
                    <div className="flex flex-col items-end gap-3 shrink-0">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border ${statusVariant[status] || statusVariant.pending}`}>
                        <SIcon className="h-3 w-3" />
                        {statusLabel[status] || status}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedRequest(item)}
                        className="flex items-center gap-1 text-xs"
                      >
                        Lihat Detail
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {selectedRequest && (
        <DetailModal
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
        />
      )}
    </div>
  );
}
