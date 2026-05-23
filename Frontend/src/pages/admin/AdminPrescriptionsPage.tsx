import { useState, useEffect } from "react";
import {
  Loader2,
  Search,
  CheckCircle,
  XCircle,
  Eye,
  Clock,
  Shield,
  Stethoscope,
  MapPin,
  Phone,
  User,
  Truck,
  Box,
  ClipboardList
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { prescriptionService } from "@/services/api";

interface Medication {
  name: string;
  dosage: string;
  duration: string;
  instructions: string;
}

interface PrescriptionItem {
  id: string;
  patient_id: string;
  doctor_id: string;
  medications: Medication[];
  notes: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  patient_name: string;
  doctor_name: string;
  shipping_address: string;
  patient_phone: string;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; className: string; icon: React.ElementType }
> = {
  waiting_confirmation: {
    label: "Menunggu Konfirmasi",
    className: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800",
    icon: Clock,
  },
  processing: {
    label: "Diproses",
    className: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
    icon: ClipboardList,
  },
  packaging: {
    label: "Dikemas",
    className: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800",
    icon: Box,
  },
  shipping: {
    label: "Dikirim",
    className: "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800",
    icon: Truck,
  },
  completed: {
    label: "Selesai",
    className: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800",
    icon: CheckCircle,
  },
};

export default function AdminPrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedPrescription, setSelectedPrescription] = useState<PrescriptionItem | null>(null);
  const [newStatus, setNewStatus] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchPrescriptions = async () => {
    setIsLoading(true);
    try {
      const res = await prescriptionService.getAdminPrescriptionsList();
      setPrescriptions(res.data);
    } catch (err: any) {
      toast.error("Gagal memuat data resep");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const handleOpenDetail = (prescription: PrescriptionItem) => {
    setSelectedPrescription(prescription);
    setNewStatus(prescription.status);
  };

  const handleUpdateStatus = async () => {
    if (!selectedPrescription || !newStatus) return;
    setIsUpdating(true);
    try {
      await prescriptionService.updatePrescriptionStatus(selectedPrescription.id, newStatus);
      toast.success("Status resep berhasil diperbarui");
      setSelectedPrescription(null);
      fetchPrescriptions();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Gagal memperbarui status resep");
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (iso: string) => {
    if (!iso) return "-";
    try {
      return new Date(iso).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  const filteredPrescriptions = statusFilter === "all" 
    ? prescriptions 
    : prescriptions.filter((p) => p.status === statusFilter);

  const waitingCount = prescriptions.filter((p) => p.status === "waiting_confirmation").length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Stethoscope className="h-6 w-6 text-primary" />
            Tracking Distribusi Obat
          </h1>
          <p className="text-muted-foreground mt-1">
            Pantau dan kelola proses pengiriman obat resep pasien home visit
          </p>
        </div>
        <div className="flex items-center gap-3">
          {waitingCount > 0 && (
            <Badge className="bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 px-3 py-1">
              <Clock className="h-3.5 w-3.5 mr-1" />
              {waitingCount} Menunggu Konfirmasi
            </Badge>
          )}
          <Badge variant="secondary" className="px-3 py-1 text-sm font-medium">
            Total Resep: {prescriptions.length}
          </Badge>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Search className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Filter Status:</span>
        <div className="flex flex-wrap gap-2">
          {[
            { value: "all", label: "Semua" },
            { value: "waiting_confirmation", label: "Menunggu Konfirmasi" },
            { value: "processing", label: "Diproses" },
            { value: "packaging", label: "Dikemas" },
            { value: "shipping", label: "Dikirim" },
            { value: "completed", label: "Selesai" },
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

      {/* Prescription list rendering */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      ) : filteredPrescriptions.length === 0 ? (
        <Card className="shadow-card">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <ClipboardList className="h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground font-medium">
              Tidak ada data resep{statusFilter !== "all" ? ` dengan status "${STATUS_CONFIG[statusFilter]?.label}"` : ""}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredPrescriptions.map((prescription) => {
            const statusMeta = STATUS_CONFIG[prescription.status] || STATUS_CONFIG.waiting_confirmation;
            const StatusIcon = statusMeta.icon;
            
            return (
              <Card
                key={prescription.id}
                className="shadow-card hover:shadow-card-hover transition-all cursor-pointer"
                onClick={() => handleOpenDetail(prescription)}
              >
                <CardContent className="p-5">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className={statusMeta.className}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusMeta.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Dibuat: {formatDate(prescription.created_at)}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                            <User className="h-4 w-4 text-muted-foreground" />
                            {prescription.patient_name}
                          </p>
                          <p className="text-xs text-muted-foreground pl-5">
                            Dokter Pembuat: {prescription.doctor_name}
                          </p>
                        </div>
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <p className="flex items-start gap-1">
                            <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5 text-muted-foreground" />
                            <span className="truncate">{prescription.shipping_address}</span>
                          </p>
                          {prescription.patient_phone && (
                            <p className="flex items-center gap-1">
                              <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>{prescription.patient_phone}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="pt-1">
                        <p className="text-xs font-semibold text-foreground">
                          Obat ({prescription.medications.length}):
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {prescription.medications.map((m) => `${m.name} (${m.dosage})`).join(", ")}
                        </p>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="shrink-0 gap-1.5 self-end md:self-start"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDetail(prescription);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                      Detail & Update
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog
        open={!!selectedPrescription}
        onOpenChange={(open) => {
          if (!open) setSelectedPrescription(null);
        }}
      >
        <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
          {selectedPrescription && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Stethoscope className="h-5 w-5 text-primary" />
                  Detail Resep & Tracking Obat
                </DialogTitle>
                <DialogDescription>
                  ID: {selectedPrescription.id.slice(0, 8)}... • {formatDate(selectedPrescription.created_at)}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                {/* Patient, Doctor & Phone Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-muted/40 border">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">
                      Pasien
                    </p>
                    <p className="font-semibold text-sm text-foreground">
                      {selectedPrescription.patient_name}
                    </p>
                    {selectedPrescription.patient_phone && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <Phone className="h-3 w-3" />
                        {selectedPrescription.patient_phone}
                      </p>
                    )}
                  </div>
                  <div className="p-3 rounded-lg bg-muted/40 border">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">
                      Dokter Pengirim Resep
                    </p>
                    <p className="font-semibold text-sm text-foreground">
                      {selectedPrescription.doctor_name}
                    </p>
                  </div>
                </div>

                {/* Delivery Address */}
                <div className="p-3 rounded-lg bg-muted/40 border space-y-1">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                    Alamat Pengiriman Obat
                  </p>
                  <p className="text-xs text-foreground flex items-start gap-1.5 leading-relaxed">
                    <MapPin className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                    {selectedPrescription.shipping_address}
                  </p>
                </div>

                {/* Medications List */}
                <div className="p-3 rounded-lg bg-muted/40 border space-y-2">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                    Daftar Obat
                  </p>
                  <div className="space-y-2">
                    {selectedPrescription.medications.map((med, index) => (
                      <div key={index} className="p-2 bg-background border rounded text-xs">
                        <div className="flex justify-between font-semibold">
                          <span className="text-primary">{med.name}</span>
                          <span className="text-muted-foreground">{med.dosage} • {med.duration}</span>
                        </div>
                        {med.instructions && (
                          <p className="text-muted-foreground mt-1 font-medium">
                            Instruksi: {med.instructions}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                {selectedPrescription.notes && (
                  <div className="p-3 rounded-lg bg-muted/40 border">
                    <p className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider mb-1">
                      Catatan Dokter
                    </p>
                    <p className="text-xs text-foreground leading-relaxed">
                      {selectedPrescription.notes}
                    </p>
                  </div>
                )}

                {/* Status Update */}
                <div className="border-t pt-4 space-y-3">
                  <p className="text-sm font-semibold text-foreground">
                    Update Status Proses Distribusi Obat
                  </p>

                  <div className="space-y-2">
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih status baru..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="waiting_confirmation">Menunggu Konfirmasi</SelectItem>
                        <SelectItem value="processing">Diproses</SelectItem>
                        <SelectItem value="packaging">Dikemas</SelectItem>
                        <SelectItem value="shipping">Dikirim</SelectItem>
                        <SelectItem value="completed">Selesai / Terkirim</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  variant="outline"
                  onClick={() => setSelectedPrescription(null)}
                  disabled={isUpdating}
                >
                  Batal
                </Button>
                <Button
                  onClick={handleUpdateStatus}
                  disabled={isUpdating || newStatus === selectedPrescription.status}
                  className="gap-2"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Simpan Perubahan
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
