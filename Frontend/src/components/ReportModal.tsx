import { useState } from "react";
import { AlertTriangle, Send, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { reportService } from "@/services/api";
import { toast } from "sonner";

interface ReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportedId: string;
  reportedName: string;
  contextType: "consultation" | "emergency";
  contextId?: string;
}

const REASON_OPTIONS = [
  { value: "inappropriate_behavior", label: "Perilaku Tidak Pantas" },
  { value: "unprofessional", label: "Tidak Profesional" },
  { value: "harassment", label: "Pelecehan / Harassment" },
  { value: "fraud", label: "Penipuan / Fraud" },
  { value: "other", label: "Lainnya" },
];

export default function ReportModal({
  open,
  onOpenChange,
  reportedId,
  reportedName,
  contextType,
  contextId,
}: ReportModalProps) {
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const resetForm = () => {
    setReason("");
    setDescription("");
    setIsSuccess(false);
  };

  const handleClose = (val: boolean) => {
    if (!val) {
      resetForm();
    }
    onOpenChange(val);
  };

  const handleSubmit = async () => {
    if (!reason || description.trim().length < 10) {
      toast.error("Mohon lengkapi alasan dan deskripsi (min. 10 karakter)");
      return;
    }

    setIsSubmitting(true);
    try {
      await reportService.createReport({
        reported_id: reportedId,
        reason,
        description: description.trim(),
        context_type: contextType,
        context_id: contextId,
      });
      setIsSuccess(true);
      toast.success("Laporan berhasil dikirim");
    } catch (err: any) {
      const detail = err?.response?.data?.detail || "Gagal mengirim laporan";
      toast.error(detail);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px]">
        {isSuccess ? (
          /* Success state */
          <div className="flex flex-col items-center justify-center py-8 text-center animate-fade-in">
            <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">
              Laporan Terkirim
            </h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs">
              Terima kasih atas laporannya. Tim admin kami akan meninjau dan
              menindaklanjuti laporan Anda.
            </p>
            <Button onClick={() => handleClose(false)} className="min-w-[120px]">
              Tutup
            </Button>
          </div>
        ) : (
          /* Form state */
          <>
            <DialogHeader>
              <div className="flex items-center gap-3 mb-1">
                <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <DialogTitle>Laporkan Pengguna</DialogTitle>
                  <DialogDescription className="mt-0.5">
                    Melaporkan <strong>{reportedName}</strong>
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Reason select */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Alasan Laporan <span className="text-destructive">*</span>
                </label>
                <Select value={reason} onValueChange={setReason}>
                  <SelectTrigger id="report-reason">
                    <SelectValue placeholder="Pilih alasan laporan..." />
                  </SelectTrigger>
                  <SelectContent>
                    {REASON_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Description textarea */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Deskripsi Detail <span className="text-destructive">*</span>
                </label>
                <Textarea
                  id="report-description"
                  placeholder="Jelaskan secara detail apa yang terjadi (min. 10 karakter)..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  maxLength={1000}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground text-right">
                  {description.length}/1000
                </p>
              </div>

              {/* Info notice */}
              <div className="rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 p-3">
                <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                  <strong>Catatan:</strong> Laporan palsu atau yang dibuat dengan
                  itikad buruk dapat mengakibatkan tindakan terhadap akun Anda.
                  Pastikan laporan Anda berdasarkan kejadian yang sebenarnya.
                </p>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-2">
              <Button
                variant="outline"
                onClick={() => handleClose(false)}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button
                variant="destructive"
                onClick={handleSubmit}
                disabled={isSubmitting || !reason || description.trim().length < 10}
                className="gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Mengirim...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Kirim Laporan
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
