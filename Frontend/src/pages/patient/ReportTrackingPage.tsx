import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Loader2,
  FileWarning,
  ArrowLeft,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { reportService } from "@/services/api";

interface Report {
  id: string;
  reporter_id: string;
  reported_id: string;
  reporter_role: string;
  reported_role: string;
  reporter_name: string;
  reported_name: string;
  reason: string;
  description: string;
  context_type: string;
  context_id?: string;
  status: string;
  admin_notes?: string;
  created_at: string;
  updated_at?: string;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; className: string; icon: React.ElementType; step: number }
> = {
  pending: {
    label: "Menunggu",
    className:
      "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300",
    icon: Clock,
    step: 1,
  },
  reviewed: {
    label: "Ditinjau",
    className:
      "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300",
    icon: Eye,
    step: 2,
  },
  resolved: {
    label: "Selesai",
    className:
      "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300",
    icon: CheckCircle,
    step: 3,
  },
  dismissed: {
    label: "Ditolak",
    className:
      "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800/30 dark:text-gray-400",
    icon: XCircle,
    step: 3,
  },
};

const REASON_LABELS: Record<string, string> = {
  inappropriate_behavior: "Perilaku Tidak Pantas",
  unprofessional: "Tidak Profesional",
  harassment: "Pelecehan",
  fraud: "Penipuan",
  other: "Lainnya",
};

const ROLE_LABELS: Record<string, string> = {
  patient: "Pasien",
  doctor: "Dokter",
  ambulance: "Ambulance",
  admin: "Admin",
};

const PROGRESS_STEPS = [
  { status: "pending", label: "Dikirim", desc: "Laporan telah diterima" },
  { status: "reviewed", label: "Ditinjau", desc: "Admin sedang meninjau" },
  { status: "resolved", label: "Selesai", desc: "Laporan telah ditindak" },
];

export default function ReportTrackingPage() {
  const user =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user") || "null")
      : null;
  const userId = user?.id || user?.sub || null;

  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showMobileDetail, setShowMobileDetail] = useState(false);

  // Fetch reports
  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const res = await reportService.getMyReports();
      setReports(res.data.reports);
    } catch {
      toast.error("Gagal memuat laporan");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // WebSocket for real-time status updates
  useEffect(() => {
    if (!userId) return;

    const port =
      window.location.hostname === "localhost" ? "8001" : window.location.port;
    const wsUrl = `${
      window.location.protocol === "https:" ? "wss" : "ws"
    }://${window.location.hostname}:${port}/ws/chat/${userId}`;

    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "report_status_update") {
          setReports((prev) =>
            prev.map((r) =>
              r.id === data.report_id
                ? { ...r, status: data.new_status, admin_notes: data.admin_notes }
                : r
            )
          );
          setSelectedReport((prev) =>
            prev && prev.id === data.report_id
              ? { ...prev, status: data.new_status, admin_notes: data.admin_notes }
              : prev
          );
          toast.info(`Status laporan diperbarui: ${data.new_status}`);
        }
      } catch (e) {
        console.error("WS error", e);
      }
    };

    ws.onclose = () => console.log("Report tracking WS closed");

    return () => ws.close();
  }, [userId]);

  const handleSelectReport = (report: Report) => {
    setSelectedReport(report);
    setShowMobileDetail(true);
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const formatDateTime = (iso: string) =>
    new Date(iso).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  if (!userId) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <FileWarning className="h-8 w-8 text-muted-foreground mb-3" />
        <p className="text-muted-foreground">
          Silakan login untuk melihat laporan Anda.
        </p>
      </div>
    );
  }

  // Helper: get step index for a status
  const getStepIndex = (status: string) => {
    if (status === "dismissed") return -1; // special
    const idx = PROGRESS_STEPS.findIndex((s) => s.status === status);
    return idx >= 0 ? idx : 0;
  };

  return (
    <div className="animate-fade-in h-[calc(100vh-140px)] flex rounded-xl shadow-card overflow-hidden bg-card border border-border/50">
      {/* Left Panel — Reports List */}
      <div
        className={`${
          showMobileDetail ? "hidden" : "block"
        } md:block w-full md:w-80 lg:w-96 border-r border-border/50 flex-shrink-0 bg-muted/10 flex flex-col`}
      >
        <div className="p-4 border-b border-border/50 bg-card">
          <h2 className="font-semibold text-lg text-foreground flex items-center gap-2">
            <FileWarning className="h-5 w-5 text-primary" />
            Laporan Saya
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Pantau status laporan Anda secara real-time
          </p>
        </div>

        <div className="overflow-y-auto flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 text-primary animate-spin" />
            </div>
          ) : reports.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground flex flex-col items-center">
              <div className="bg-primary/10 p-3 rounded-full mb-3">
                <FileWarning className="h-6 w-6 text-primary" />
              </div>
              <p className="font-medium text-foreground mb-1">
                Belum ada laporan
              </p>
              <p className="text-xs">
                Laporan yang Anda buat akan muncul di sini.
              </p>
            </div>
          ) : (
            reports.map((report) => {
              const statusMeta =
                STATUS_CONFIG[report.status] || STATUS_CONFIG.pending;
              const StatusIcon = statusMeta.icon;
              const isSelected = selectedReport?.id === report.id;

              return (
                <button
                  key={report.id}
                  onClick={() => handleSelectReport(report)}
                  className={`w-full text-left p-4 transition-colors border-b border-border/50 last:border-0 ${
                    isSelected
                      ? "bg-primary/10 border-l-4 border-l-primary"
                      : "hover:bg-muted/50 border-l-4 border-l-transparent"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <Badge className={`${statusMeta.className} text-[10px]`}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusMeta.label}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {formatDate(report.created_at)}
                    </span>
                  </div>
                  <p className="font-medium text-sm text-foreground truncate">
                    vs {report.reported_name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {REASON_LABELS[report.reason] || report.reason}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                    {report.description}
                  </p>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right Panel — Detail + Progress Tracking */}
      <div
        className={`${
          !showMobileDetail ? "hidden" : "flex"
        } md:flex flex-1 flex-col min-w-0 bg-background/50`}
      >
        {selectedReport ? (
          <div className="flex-1 overflow-y-auto">
            {/* Header */}
            <div className="p-4 sm:p-6 border-b border-border/50 bg-card">
              <div className="flex items-center gap-3 mb-4">
                <button
                  className="md:hidden p-1 -ml-1 rounded-md hover:bg-muted"
                  onClick={() => setShowMobileDetail(false)}
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-foreground truncate">
                      Laporan terhadap {selectedReport.reported_name}
                    </h3>
                    {(() => {
                      const sm =
                        STATUS_CONFIG[selectedReport.status] ||
                        STATUS_CONFIG.pending;
                      const Icon = sm.icon;
                      return (
                        <Badge className={`${sm.className} text-[10px] shrink-0`}>
                          <Icon className="h-3 w-3 mr-1" />
                          {sm.label}
                        </Badge>
                      );
                    })()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(selectedReport.created_at)}
                  </p>
                </div>
              </div>

              {/* Report Info Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-muted/30 border">
                  <p className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider mb-1">
                    Yang Dilaporkan
                  </p>
                  <p className="font-medium text-sm">{selectedReport.reported_name}</p>
                  <Badge variant="secondary" className="text-[10px] mt-1">
                    {ROLE_LABELS[selectedReport.reported_role] || selectedReport.reported_role}
                  </Badge>
                </div>
                <div className="p-3 rounded-lg bg-muted/30 border">
                  <p className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider mb-1">
                    Alasan
                  </p>
                  <p className="font-medium text-sm">
                    {REASON_LABELS[selectedReport.reason] || selectedReport.reason}
                  </p>
                  <Badge variant="outline" className="text-[10px] mt-1 capitalize">
                    {selectedReport.context_type === "consultation" ? "Konsultasi" : "Emergency"}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="p-4 sm:p-6 border-b border-border/50">
              <p className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider mb-2">
                Deskripsi Laporan
              </p>
              <p className="text-sm text-foreground leading-relaxed bg-muted/20 rounded-lg p-4 border">
                {selectedReport.description}
              </p>
            </div>

            {/* Progress Tracking Timeline */}
            <div className="p-4 sm:p-6 border-b border-border/50">
              <p className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider mb-4">
                Status Tracking
              </p>

              {selectedReport.status === "dismissed" ? (
                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
                      <XCircle className="h-5 w-5 text-gray-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-foreground">Laporan Ditolak</p>
                      <p className="text-xs text-muted-foreground">
                        Admin telah meninjau dan menolak laporan ini.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-0">
                  {PROGRESS_STEPS.map((step, index) => {
                    const currentStep = getStepIndex(selectedReport.status);
                    const isDone = index <= currentStep;
                    const isActive = index === currentStep;
                    const isLast = index === PROGRESS_STEPS.length - 1;

                    return (
                      <div key={step.status} className="flex gap-4">
                        {/* Timeline line + dot */}
                        <div className="flex flex-col items-center">
                          <div
                            className={`h-10 w-10 rounded-full flex items-center justify-center border-2 transition-all ${
                              isDone
                                ? isActive
                                  ? "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/30"
                                  : "border-green-500 bg-green-500 text-white"
                                : "border-border bg-muted text-muted-foreground"
                            }`}
                          >
                            {isDone && !isActive ? (
                              <CheckCircle className="h-5 w-5" />
                            ) : (
                              <span className="text-sm font-bold">{index + 1}</span>
                            )}
                          </div>
                          {!isLast && (
                            <div
                              className={`w-0.5 h-12 transition-all ${
                                index < currentStep
                                  ? "bg-green-500"
                                  : "bg-border"
                              }`}
                            />
                          )}
                        </div>

                        {/* Content */}
                        <div className={`pb-8 pt-2 ${isLast ? "pb-0" : ""}`}>
                          <p
                            className={`font-semibold text-sm ${
                              isDone ? "text-foreground" : "text-muted-foreground"
                            }`}
                          >
                            {step.label}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {step.desc}
                          </p>
                          {isActive && (
                            <div className="mt-2 flex items-center gap-1.5">
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                              </span>
                              <span className="text-[10px] text-primary font-medium uppercase tracking-wider">
                                Status saat ini
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Admin Notes */}
            {selectedReport.admin_notes && (
              <div className="p-4 sm:p-6">
                <p className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider mb-2">
                  Catatan Admin
                </p>
                <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-800 dark:text-blue-300 leading-relaxed">
                    {selectedReport.admin_notes}
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="bg-primary/10 p-5 rounded-full mb-4">
              <FileWarning className="h-12 w-12 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">
              Report Tracking
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Pilih laporan di sebelah kiri untuk melihat detail dan progress tracking.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
