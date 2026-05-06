import { useState, useEffect } from "react";
import {
  Calendar, Clock, MapPin, Phone, User, CheckCircle2,
  XCircle, AlertCircle, Loader2, ChevronRight, Home, RefreshCw, X
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import api from "@/services/api";

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

const statusLabel: Record<string, string> = {
  pending: "Menunggu Konfirmasi",
  approved: "Diterima",
  rejected: "Ditolak",
  completed: "Selesai",
  cancelled: "Dibatalkan",
};

const statusVariant: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  approved: "bg-green-100  text-green-800  border-green-200",
  rejected: "bg-red-100    text-red-800    border-red-200",
  completed: "bg-blue-100   text-blue-800   border-blue-200",
  cancelled: "bg-gray-100   text-gray-600   border-gray-200",
};

const StatusIcon: Record<string, any> = {
  pending: AlertCircle,
  approved: CheckCircle2,
  rejected: XCircle,
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

export default function DoctorHomeVisits() {
  const [requests, setRequests] = useState<HomeVisitRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [selectedRequest, setSelectedRequest] = useState<HomeVisitRequest | null>(null);
  const [modalAction, setModalAction] = useState<"view" | "approve" | "reject">("view");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/home-visits/doctor-requests");
      setRequests(res.data || []);
    } catch (err: any) {
      console.error(err);
      setError("Gagal memuat data permintaan kunjungan rumah.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleStatusUpdate = async () => {
    if (!selectedRequest) return;

    setIsSubmitting(true);
    const newStatus = modalAction === "approve" ? "approved" : "rejected";

    try {
      await api.patch(`/home-visits/${selectedRequest.id}/status`, {
        status: newStatus,
        notes: notes
      });
      toast.success(`Permintaan berhasil ${newStatus === "approved" ? "diterima" : "ditolak"}`);
      setSelectedRequest(null);
      loadRequests();
    } catch (err) {
      console.error(err);
      toast.error("Gagal mengupdate status permintaan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openActionModal = (request: HomeVisitRequest, action: "approve" | "reject") => {
    setSelectedRequest(request);
    setModalAction(action);
    setNotes(request.notes || "");
  };

  const openViewModal = (request: HomeVisitRequest) => {
    setSelectedRequest(request);
    setModalAction("view");
    setNotes("");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-background p-6 rounded-2xl shadow-sm border">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Permintaan Home Visit</h1>
          <p className="text-muted-foreground mt-1">Kelola dan respons permintaan kunjungan ke rumah pasien</p>
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
              <h3 className="font-semibold text-foreground">Belum ada permintaan</h3>
              <p className="text-sm text-muted-foreground mt-1">Tidak ada permintaan kunjungan rumah untuk Anda saat ini.</p>
            </div>
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
              <Card key={item.id} className="shadow-card hover:shadow-md transition-shadow border-l-4 overflow-hidden"
                style={{ borderLeftColor: status === "approved" ? "#16a34a" : status === "rejected" ? "#dc2626" : status === "completed" ? "#2563eb" : status === "cancelled" ? "#9ca3af" : "#ca8a04" }}>
                <CardContent className="p-0">
                  <div className="p-5 flex flex-col md:flex-row md:items-start justify-between gap-6">
                    {/* Left info */}
                    <div className="flex-1 min-w-0 space-y-4">
                      {/* Patient header */}
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold shrink-0">
                          {item.patient_name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "PS"}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{item.patient_name}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {item.phone_number}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Date & Time */}
                        <div className="flex items-center gap-2 text-sm text-foreground bg-muted/50 p-2 rounded-lg">
                          <div className="p-2 bg-background rounded-md shadow-sm">
                            <Calendar className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground font-medium">Jadwal</p>
                            <p className="font-medium">{formatDate(item.preferred_date)} • {item.preferred_time}</p>
                          </div>
                        </div>

                        {/* Complaint summary */}
                        <div className="text-sm">
                          <p className="text-xs text-muted-foreground font-medium mb-0.5">Keluhan Utama</p>
                          <p className="truncate text-foreground">{item.complaint}</p>
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex flex-col items-start md:items-end gap-3 shrink-0 md:min-w-[180px] border-t md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-6">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${statusVariant[status] || statusVariant.pending}`}>
                        <SIcon className="h-3.5 w-3.5" />
                        {statusLabel[status] || status}
                      </span>

                      {status === "pending" ? (
                        <div className="flex gap-2 w-full mt-2">
                          <Button size="sm" variant="outline" className="flex-1 bg-green-50 text-green-700 hover:bg-green-100 border-green-200" onClick={() => openActionModal(item, "approve")}>
                            <CheckCircle2 className="h-4 w-4 mr-1" /> Terima
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1 bg-red-50 text-red-700 hover:bg-red-100 border-red-200" onClick={() => openActionModal(item, "reject")}>
                            <XCircle className="h-4 w-4 mr-1" /> Tolak
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openViewModal(item)}
                          className="w-full justify-between mt-2 text-primary hover:bg-primary/5"
                        >
                          Lihat Detail <ChevronRight className="h-4 w-4" />
                        </Button>
                      )}

                      {status === "pending" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openViewModal(item)}
                          className="w-full text-xs text-muted-foreground"
                        >
                          Lihat Detail Lengkap
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Action / View Modal */}
      {selectedRequest && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in"
          onClick={() => !isSubmitting && setSelectedRequest(null)}
        >
          <div
            className="bg-background rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className={`p-6 text-white ${modalAction === 'approve' ? 'bg-green-600' : modalAction === 'reject' ? 'bg-red-600' : 'medical-gradient'}`}>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">
                  {modalAction === "approve" ? "Terima Permintaan" :
                    modalAction === "reject" ? "Tolak Permintaan" : "Detail Permintaan"}
                </h2>
                <button
                  onClick={() => !isSubmitting && setSelectedRequest(null)}
                  className="rounded-full p-2 hover:bg-black/20 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="text-white/80 text-sm mt-1">
                Diajukan pada {formatDateTime(selectedRequest.created_at)}
              </p>
            </div>

            <div className="overflow-y-auto flex-1 p-6 space-y-6">
              {/* Patient Info Card */}
              <div className="bg-muted/30 rounded-xl p-4 space-y-4 border border-muted">
                <DetailRow icon={<User className="h-4 w-4 text-primary" />} label="Nama Pasien" value={selectedRequest.patient_name} />
                <DetailRow icon={<Phone className="h-4 w-4 text-primary" />} label="Telepon" value={selectedRequest.phone_number} />
                <DetailRow icon={<Calendar className="h-4 w-4 text-primary" />} label="Jadwal Diminta" value={`${formatDate(selectedRequest.preferred_date)} jam ${selectedRequest.preferred_time || "-"}`} />
                <DetailRow icon={<MapPin className="h-4 w-4 text-primary" />} label="Alamat Kunjungan" value={selectedRequest.address} multiline />
              </div>

              {/* Medical Info */}
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-primary" /> Detail Medis
                </h3>
                <div className="bg-background rounded-xl p-4 border shadow-sm">
                  <DetailRow icon={null} label="Keluhan Utama" value={selectedRequest.complaint} multiline />
                </div>
              </div>

              {/* Status Section for View Mode */}
              {modalAction === "view" && selectedRequest.status !== "pending" && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" /> Status & Catatan
                  </h3>
                  <div className={`rounded-xl p-4 border ${statusVariant[selectedRequest.status]}`}>
                    <div className="font-semibold mb-2">{statusLabel[selectedRequest.status]}</div>
                    {selectedRequest.notes ? (
                      <div>
                        <p className="text-xs uppercase tracking-wide opacity-70 mb-1">Catatan Dokter</p>
                        <p className="whitespace-pre-wrap text-sm">{selectedRequest.notes}</p>
                      </div>
                    ) : (
                      <p className="text-sm italic opacity-70">Tidak ada catatan.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Action Form */}
              {modalAction !== "view" && (
                <div className="space-y-3 animate-in slide-in-from-bottom-4">
                  <label className="text-sm font-semibold text-foreground">
                    Catatan untuk pasien {modalAction === "reject" && "(Wajib jika menolak)"}
                  </label>
                  <Textarea
                    placeholder={modalAction === "reject" ? "Berikan alasan penolakan..." : "Berikan catatan atau instruksi sebelum kunjungan (opsional)..."}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="resize-none h-28"
                  />
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-6 border-t bg-muted/10 flex flex-col-reverse sm:flex-row justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setSelectedRequest(null)}
                disabled={isSubmitting}
                className="sm:w-auto w-full"
              >
                {modalAction === "view" ? "Tutup" : "Batal"}
              </Button>

              {modalAction === "approve" && (
                <Button
                  onClick={handleStatusUpdate}
                  disabled={isSubmitting}
                  className="bg-green-600 hover:bg-green-700 text-white sm:w-auto w-full"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                  Konfirmasi Terima
                </Button>
              )}

              {modalAction === "reject" && (
                <Button
                  variant="destructive"
                  onClick={handleStatusUpdate}
                  disabled={isSubmitting || notes.trim() === ""}
                  className="sm:w-auto w-full"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}
                  Konfirmasi Tolak
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}