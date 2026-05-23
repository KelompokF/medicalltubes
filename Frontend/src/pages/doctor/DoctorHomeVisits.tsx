import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
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

// statusLabel resolved via t() inside component

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
  const { t } = useTranslation();
  const [requests, setRequests] = useState<HomeVisitRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const statusLabel: Record<string, string> = {
    pending: t("doctor.homeVisits.statusPending"),
    approved: t("doctor.homeVisits.statusApproved"),
    rejected: t("doctor.homeVisits.statusRejected"),
    completed: t("doctor.homeVisits.statusCompleted"),
    cancelled: t("doctor.homeVisits.statusCancelled"),
  };

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
      setError(t("doctor.homeVisits.loadFailed"));
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
      toast.success(newStatus === "approved" ? t("doctor.homeVisits.acceptSuccess") : t("doctor.homeVisits.rejectSuccess"));
      setSelectedRequest(null);
      loadRequests();
    } catch (err) {
      console.error(err);
      toast.error(t("doctor.homeVisits.updateFailed"));
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
          <h1 className="text-2xl font-bold text-foreground">{t("doctor.homeVisits.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("doctor.homeVisits.subtitle")}</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadRequests} className="flex items-center gap-2 w-fit">
          <RefreshCw className="h-4 w-4" />
          {t("common.refresh")}
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
              <h3 className="font-semibold text-foreground">{t("doctor.homeVisits.noRequests")}</h3>
              <p className="text-sm text-muted-foreground mt-1">{t("doctor.homeVisits.noRequestsDesc")}</p>
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
                    <div className="flex-1 min-w-0 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold shrink-0">
                          {item.patient_name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "PS"}
                        </div>
                        <div>
                          <p><span className="font-medium">{t("common.patient")}:</span> {item.patient_name}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {item.phone_number}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex items-center gap-2 text-sm text-foreground bg-muted/50 p-2 rounded-lg">
                          <div className="p-2 bg-background rounded-md shadow-sm">
                            <Calendar className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground font-medium">{t("common.schedule")}</p>
                            <p className="font-medium">{formatDate(item.preferred_date)} • {item.preferred_time}</p>
                          </div>
                        </div>

                        <div className="text-sm">
                          <p className="text-xs text-muted-foreground font-medium mb-0.5">{t("common.complaint")}</p>
                          <p className="truncate text-foreground">{item.complaint}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-start md:items-end gap-3 shrink-0 md:min-w-[180px] border-t md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-6">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${statusVariant[status] || statusVariant.pending}`}>
                        <SIcon className="h-3.5 w-3.5" />
                        {statusLabel[status] || status}
                      </span>

                      {status === "pending" ? (
                        <div className="flex flex-col gap-2 w-full mt-2">
                          <div className="flex gap-2 w-full">
                            <Button size="sm" variant="outline" className="flex-1 bg-green-50 text-green-700 hover:bg-green-100 border-green-200" onClick={() => { setModalAction("approve"); setSelectedRequest(item); }}>
                              <CheckCircle2 className="h-4 w-4 mr-1" /> {t("doctor.homeVisits.accept")}
                            </Button>
                            <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => { setModalAction("reject"); setSelectedRequest(item); }}>
                              <XCircle className="h-4 w-4 mr-1" /> {t("doctor.homeVisits.reject")}
                            </Button>
                          </div>
                          <Button size="sm" variant="ghost" onClick={() => { setModalAction("view"); setSelectedRequest(item); }}>
                            {t("doctor.homeVisits.viewDetail")} <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </div>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => { setModalAction("view"); setSelectedRequest(item); }} className="w-full text-xs">
                          {t("doctor.homeVisits.viewFullDetail")} <ChevronRight className="h-3.5 w-3.5 ml-1" />
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
            <div className={`p-6 text-white ${modalAction === 'approve' ? 'bg-green-600' : modalAction === 'reject' ? 'bg-red-600' : 'bg-primary'}`}>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">
                  {modalAction === "approve" ? t("doctor.homeVisits.acceptRequest") :
                    modalAction === "reject" ? t("doctor.homeVisits.rejectRequest") :
                      t("doctor.homeVisits.requestDetail")}
                </h2>
                <button onClick={() => !isSubmitting && setSelectedRequest(null)} className="rounded-full p-2 hover:bg-white/20 transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="text-white/80 text-sm mt-1">
                {t("doctor.homeVisits.submittedAt", { date: formatDateTime(selectedRequest.created_at) })}
              </p>
            </div>

            <div className="overflow-y-auto flex-1 p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DetailRow icon={<User className="h-4 w-4" />} label={t("doctor.homeVisits.patientName")} value={selectedRequest.patient_name} />
                <DetailRow icon={<Phone className="h-4 w-4" />} label={t("doctor.homeVisits.phoneLabel")} value={selectedRequest.phone_number} />
                <DetailRow icon={<Calendar className="h-4 w-4" />} label={t("doctor.homeVisits.scheduledDate")} value={formatDate(selectedRequest.preferred_date)} />
                <DetailRow icon={<Clock className="h-4 w-4" />} label={t("common.time")} value={selectedRequest.preferred_time || "-"} />
              </div>

              <div className="border-t pt-4">
                <DetailRow icon={<MapPin className="h-4 w-4" />} label={t("doctor.homeVisits.visitAddress")} value={selectedRequest.address} multiline />
              </div>

              <div className="border-t pt-4">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-2">{t("doctor.homeVisits.medicalDetails")}</p>
                <div className="bg-muted/30 rounded-lg p-4 text-sm text-foreground">
                  <span className="font-semibold block mb-1">{t("doctor.homeVisits.mainComplaint")}:</span>
                  {selectedRequest.complaint}
                </div>
              </div>

              {selectedRequest.status !== "pending" && (
                <div className="border-t pt-4">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-2">{t("doctor.homeVisits.statusAndNotes")}</p>
                  <div className="bg-primary/5 rounded-lg p-4 text-sm border border-primary/10">
                    <span className="font-semibold block mb-1">{t("doctor.homeVisits.doctorNotes")}:</span>
                    <p className="text-muted-foreground whitespace-pre-wrap">{selectedRequest.notes || t("doctor.homeVisits.noNotes")}</p>
                  </div>
                </div>
              )}

              {modalAction !== "view" && (
                <div className="border-t pt-4 space-y-3">
                  <label className="text-sm font-medium text-foreground">
                    {t("doctor.homeVisits.notesForPatient", { context: modalAction === "approve" ? "" : t("doctor.homeVisits.rejectReasonRequired") })}
                  </label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={modalAction === "reject"
                      ? t("doctor.homeVisits.rejectPlaceholder")
                      : t("doctor.homeVisits.acceptPlaceholder")
                    }
                    className="min-h-[100px]"
                  />
                </div>
              )}
            </div>

            <div className="p-6 pt-0 flex gap-3 justify-end bg-background rounded-b-2xl">
              <Button variant="outline" onClick={() => { setSelectedRequest(null); setNotes(""); }}>
                {modalAction === "view" ? t("common.close") : t("common.cancel")}
              </Button>
              {modalAction === "approve" && (
                <Button
                  onClick={handleStatusUpdate}
                  disabled={isSubmitting}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground sm:w-auto w-full"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                  {t("doctor.homeVisits.confirmAccept", "Konfirmasi Terima")}
                </Button>
              )}
              {modalAction === "reject" && (
                <Button
                  variant="destructive"
                  onClick={handleStatusUpdate}
                  disabled={isSubmitting || !notes.trim()}
                  className="sm:w-auto w-full"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}
                  {t("doctor.homeVisits.confirmReject", "Konfirmasi Tolak")}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}