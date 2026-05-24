import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  AlertTriangle,
  Loader2,
  Search,
  CheckCircle,
  XCircle,
  Eye,
  Clock,
  Shield,
  FileWarning,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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



export default function AdminReportsPage() {
  const { t } = useTranslation();
  const [reports, setReports] = useState<Report[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const STATUS_CONFIG: Record<
    string,
    { label: string; className: string; icon: React.ElementType }
  > = {
    pending: {
      label: t("admin.reports.status.pending", "Pending"),
      className: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800",
      icon: Clock,
    },
    reviewed: {
      label: t("admin.reports.status.reviewed", "Reviewed"),
      className: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
      icon: Eye,
    },
    resolved: {
      label: t("admin.reports.status.resolved", "Resolved"),
      className: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800",
      icon: CheckCircle,
    },
    dismissed: {
      label: t("admin.reports.status.dismissed", "Dismissed"),
      className: "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800/30 dark:text-gray-400 dark:border-gray-700",
      icon: XCircle,
    },
  };

  const REASON_LABELS: Record<string, string> = {
    inappropriate_behavior: t("admin.reports.reason.inappropriate_behavior", "Perilaku Tidak Pantas"),
    unprofessional: t("admin.reports.reason.unprofessional", "Tidak Profesional"),
    harassment: t("admin.reports.reason.harassment", "Pelecehan / Harassment"),
    fraud: t("admin.reports.reason.fraud", "Penipuan / Fraud"),
    other: t("admin.reports.reason.other", "Lainnya"),
  };

  const ROLE_LABELS: Record<string, string> = {
    patient: t("common.roles.patient", "Pasien"),
    doctor: t("common.roles.doctor", "Dokter"),
    ambulance: t("common.roles.ambulance", "Ambulance"),
    admin: t("common.roles.admin", "Admin"),
  };

  const fetchReports = async (status?: string) => {
    setIsLoading(true);
    try {
      const params = status && status !== "all" ? { status } : undefined;
      const res = await reportService.getAllReports(params);
      setReports(res.data.reports);
      setTotal(res.data.total);
    } catch (err: any) {
      toast.error(t("admin.reports.loadError", "Gagal memuat data laporan"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports(statusFilter);

    // Listen for real-time WebSocket new report injection from AdminLayout
    const handleNewReport = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail) {
        // Hanya tambahkan ke list jika sedang melihat "semua" atau "pending"
        if (statusFilter === "all" || statusFilter === "pending") {
          setReports((prev) => [customEvent.detail, ...prev]);
        }
        setTotal((prev) => prev + 1);
      }
    };
    
    window.addEventListener("new_report_data", handleNewReport);

    return () => {
      window.removeEventListener("new_report_data", handleNewReport);
    };
  }, [statusFilter]);

  const handleOpenDetail = (report: Report) => {
    setSelectedReport(report);
    setAdminNotes(report.admin_notes || "");
    setNewStatus(report.status);
  };

  const handleUpdateStatus = async () => {
    if (!selectedReport || !newStatus) return;
    setIsUpdating(true);
    try {
      await reportService.updateReportStatus(selectedReport.id, {
        status: newStatus,
        admin_notes: adminNotes || undefined,
      });
      toast.success(t("admin.reports.updateSuccess", "Status laporan berhasil diperbarui"));
      setSelectedReport(null);
      fetchReports(statusFilter);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || t("admin.reports.updateError", "Gagal memperbarui status"));
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const pendingCount = reports.filter((r) => r.status === "pending").length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            {t("admin.reports.title", "Manajemen Laporan")}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t("admin.reports.desc", "Kelola dan tindak lanjuti laporan dari pengguna")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {pendingCount > 0 && (
            <Badge className="bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 px-3 py-1">
              <AlertTriangle className="h-3.5 w-3.5 mr-1" />
              {pendingCount} {t("admin.reports.pendingCount", "Pending")}
            </Badge>
          )}
          <Badge variant="secondary" className="px-3 py-1">
            {t("admin.reports.totalReports", "Total:")} {total}
          </Badge>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Search className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">{t("admin.reports.filterStatus", "Filter Status:")}</span>
        <div className="flex flex-wrap gap-2">
          {[
            { value: "all", label: t("common.all", "Semua") },
            { value: "pending", label: t("admin.reports.status.pending", "Pending") },
            { value: "reviewed", label: t("admin.reports.status.reviewed", "Reviewed") },
            { value: "resolved", label: t("admin.reports.status.resolved", "Resolved") },
            { value: "dismissed", label: t("admin.reports.status.dismissed", "Dismissed") },
          ].map((filter) => (
            <Button
              key={filter.value}
              variant={statusFilter === filter.value ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(filter.value)}
              className="text-xs"
            >
              {filter.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Reports List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      ) : reports.length === 0 ? (
        <Card className="shadow-card">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileWarning className="h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground font-medium">
              {t("admin.reports.noData", "Tidak ada laporan")}{statusFilter !== "all" ? ` ${t("admin.reports.withStatus", "dengan status")} "${statusFilter}"` : ""}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => {
            const statusMeta = STATUS_CONFIG[report.status] || STATUS_CONFIG.pending;
            const StatusIcon = statusMeta.icon;
            return (
              <Card
                key={report.id}
                className="shadow-card hover:shadow-card-hover transition-all cursor-pointer"
                onClick={() => handleOpenDetail(report)}
              >
                <CardContent className="p-4 sm:p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className={statusMeta.className}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusMeta.label}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {report.context_type === "consultation" ? t("admin.reports.consultation", "Konsultasi") : t("admin.reports.emergency", "Emergency")}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(report.created_at)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium text-foreground">
                          {report.reporter_name}
                        </span>
                        <Badge variant="secondary" className="text-[10px]">
                          {ROLE_LABELS[report.reporter_role] || report.reporter_role}
                        </Badge>
                        <span className="text-muted-foreground">→</span>
                        <span className="font-medium text-foreground">
                          {report.reported_name}
                        </span>
                        <Badge variant="secondary" className="text-[10px]">
                          {ROLE_LABELS[report.reported_role] || report.reported_role}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="bg-destructive/5 text-destructive border-destructive/20 text-xs"
                        >
                          {REASON_LABELS[report.reason] || report.reason}
                        </Badge>
                      </div>

                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {report.description}
                      </p>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="shrink-0 gap-1.5"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDetail(report);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                      {t("common.detail", "Detail")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      <Dialog
        open={!!selectedReport}
        onOpenChange={(open) => {
          if (!open) setSelectedReport(null);
        }}
      >
        <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
          {selectedReport && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  {t("admin.reports.detailTitle", "Detail Laporan")}
                </DialogTitle>
                <DialogDescription>
                  {t("common.id", "ID:")} {selectedReport.id.slice(0, 8)}... •{" "}
                  {formatDate(selectedReport.created_at)}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                {/* Reporter & Reported */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                    <p className="text-[10px] uppercase font-bold text-blue-600 tracking-wider mb-1">
                      {t("admin.reports.reporter", "Pelapor")}
                    </p>
                    <p className="font-semibold text-sm text-foreground">
                      {selectedReport.reporter_name}
                    </p>
                    <Badge variant="secondary" className="text-[10px] mt-1">
                      {ROLE_LABELS[selectedReport.reporter_role] || selectedReport.reporter_role}
                    </Badge>
                  </div>
                  <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                    <p className="text-[10px] uppercase font-bold text-red-600 tracking-wider mb-1">
                      {t("admin.reports.reported", "Dilaporkan")}
                    </p>
                    <p className="font-semibold text-sm text-foreground">
                      {selectedReport.reported_name}
                    </p>
                    <Badge variant="secondary" className="text-[10px] mt-1">
                      {ROLE_LABELS[selectedReport.reported_role] || selectedReport.reported_role}
                    </Badge>
                  </div>
                </div>

                {/* Reason & Context */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-muted/30 border">
                    <p className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider mb-1">
                      {t("admin.reports.reasonLabel", "Alasan")}
                    </p>
                    <p className="font-medium text-sm">
                      {REASON_LABELS[selectedReport.reason] || selectedReport.reason}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30 border">
                    <p className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider mb-1">
                      {t("admin.reports.context", "Konteks")}
                    </p>
                    <p className="font-medium text-sm capitalize">
                      {selectedReport.context_type}
                    </p>
                  </div>
                </div>

                {/* Description */}
                <div className="p-3 rounded-lg bg-muted/30 border">
                  <p className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider mb-1">
                    {t("admin.reports.description", "Deskripsi")}
                  </p>
                  <p className="text-sm text-foreground leading-relaxed">
                    {selectedReport.description}
                  </p>
                </div>

                {/* Admin Actions */}
                <div className="border-t pt-4 space-y-3">
                  <p className="text-sm font-semibold text-foreground">
                    {t("admin.reports.adminActions", "Tindakan Admin")}
                  </p>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t("admin.reports.updateStatusTitle", "Update Status")}</label>
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder={t("admin.reports.selectStatus", "Pilih status baru...")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">{t("admin.reports.status.pending", "Pending")}</SelectItem>
                        <SelectItem value="reviewed">{t("admin.reports.status.reviewed", "Reviewed")}</SelectItem>
                        <SelectItem value="resolved">{t("admin.reports.status.resolved", "Resolved")}</SelectItem>
                        <SelectItem value="dismissed">{t("admin.reports.status.dismissed", "Dismissed")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {t("admin.reports.adminNotes", "Catatan Admin (opsional)")}
                    </label>
                    <Textarea
                      placeholder={t("admin.reports.adminNotesPlaceholder", "Tambahkan catatan tindak lanjut...")}
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      rows={3}
                      className="resize-none"
                    />
                  </div>
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedReport(null)}
                  disabled={isUpdating}
                >
                  {t("common.cancel", "Batal")}
                </Button>
                <Button
                  onClick={handleUpdateStatus}
                  disabled={isUpdating || newStatus === selectedReport.status}
                  className="gap-2"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t("common.saving", "Menyimpan...")}
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      {t("common.saveChanges", "Simpan Perubahan")}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
