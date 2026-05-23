import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Calendar, Clock, MapPin, Phone, User, Stethoscope,
  FileText, CreditCard, QrCode, Wallet, Loader2, ArrowRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { homeVisitScheduleService } from "@/services/api";

interface RequestDetails {
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
  payment_status: string;
}

const formatDate = (dateStr: string): string => {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
  } catch {
    return dateStr;
  }
};

export default function HomeVisitPaymentPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [request, setRequest] = useState<RequestDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<"qris" | "debit" | "cash" | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Mencegah navigasi tombol back browser
  useEffect(() => {
    window.history.pushState(null, "", window.location.href);

    const handlePopState = () => {
      window.history.pushState(null, "", window.location.href);
      toast.warning("Silakan selesaikan pembayaran Anda terlebih dahulu.");
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  useEffect(() => {
    if (!id) return;
    const fetchRequest = async () => {
      try {
        setLoading(true);
        const res = await homeVisitScheduleService.getRequestById(id);
        setRequest(res.data);
      } catch (err: any) {
        console.error(err);
        toast.error("Gagal memuat detail pemesanan.");
      } finally {
        setLoading(false);
      }
    };
    fetchRequest();
  }, [id]);

  const handlePayment = async () => {
    if (!id || paymentMethod !== "cash") return;
    try {
      setSubmitting(true);
      await homeVisitScheduleService.updatePaymentStatus(id, "paid_cash");
      toast.success("Pembayaran berhasil dikonfirmasi!");
      navigate("/tracking");
    } catch (err: any) {
      console.error(err);
      toast.error("Gagal memproses pembayaran. Silakan coba lagi.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm">Memuat detail pembayaran...</p>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="text-center py-20">
        <p className="text-destructive font-medium">Data pemesanan tidak ditemukan.</p>
        <Button onClick={() => navigate("/home-visit")} className="mt-4">
          Kembali ke Home Visit
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in relative z-10">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Pembayaran Kunjungan Rumah</h1>
        <p className="text-muted-foreground mt-1">Silakan pilih metode pembayaran untuk melanjutkan pemesanan Anda.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Payment Methods */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Metode Pembayaran
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Option 1: QRIS */}
              <div 
                className={`relative flex items-center justify-between p-4 rounded-xl border transition-all ${
                  paymentMethod === "qris" 
                    ? "border-primary bg-primary/5" 
                    : "border-muted bg-background opacity-60 cursor-not-allowed"
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    id="payment-qris"
                    name="payment-method"
                    value="qris"
                    checked={paymentMethod === "qris"}
                    disabled={true}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                  />
                  <label htmlFor="payment-qris" className="flex items-center gap-3 font-medium text-foreground cursor-not-allowed">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <QrCode className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">QRIS</p>
                      <p className="text-xs text-muted-foreground">Bayar cepat menggunakan aplikasi pembayaran digital</p>
                    </div>
                  </label>
                </div>
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                  Coming Soon
                </Badge>
              </div>

              {/* Option 2: Debit Card */}
              <div 
                className={`relative flex items-center justify-between p-4 rounded-xl border transition-all ${
                  paymentMethod === "debit" 
                    ? "border-primary bg-primary/5" 
                    : "border-muted bg-background opacity-60 cursor-not-allowed"
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    id="payment-debit"
                    name="payment-method"
                    value="debit"
                    checked={paymentMethod === "debit"}
                    disabled={true}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                  />
                  <label htmlFor="payment-debit" className="flex items-center gap-3 font-medium text-foreground cursor-not-allowed">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Debit / Credit Card</p>
                      <p className="text-xs text-muted-foreground">Transfer instan kartu Debit atau Kredit</p>
                    </div>
                  </label>
                </div>
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                  Coming Soon
                </Badge>
              </div>

              {/* Option 3: Cash */}
              <div 
                onClick={() => setPaymentMethod("cash")}
                className={`relative flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${
                  paymentMethod === "cash" 
                    ? "border-primary bg-primary/5 ring-1 ring-primary" 
                    : "border-muted hover:border-primary/50 bg-background"
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    id="payment-cash"
                    name="payment-method"
                    value="cash"
                    checked={paymentMethod === "cash"}
                    onChange={() => setPaymentMethod("cash")}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 cursor-pointer"
                  />
                  <label htmlFor="payment-cash" className="flex items-center gap-3 font-medium text-foreground cursor-pointer">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <Wallet className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Cash (Bayar di Tempat)</p>
                      <p className="text-xs text-muted-foreground">Bayar langsung kepada dokter setelah kunjungan selesai</p>
                    </div>
                  </label>
                </div>
                <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">
                  Tersedia
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Booking Summary */}
        <div className="space-y-6">
          <Card className="shadow-card sticky top-24">
            <CardHeader>
              <CardTitle className="text-lg">Ringkasan Kunjungan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-center gap-2 border-b pb-3">
                <div className="h-10 w-10 rounded-full medical-gradient flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0">
                  {request.doctor_name?.replace("Dr. ", "").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "DR"}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{request.doctor_name}</p>
                  {request.specialization && (
                    <p className="text-xs text-muted-foreground">{request.specialization}</p>
                  )}
                </div>
              </div>

              <div className="space-y-3 border-b pb-3">
                <div className="flex items-start gap-2">
                  <User className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Pasien</p>
                    <p className="text-foreground font-medium">{request.patient_name}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Nomor Telepon</p>
                    <p className="text-foreground font-medium">{request.phone_number}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Tanggal Kunjungan</p>
                    <p className="text-foreground font-medium">{formatDate(request.preferred_date)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Jam Kunjungan</p>
                    <p className="text-foreground font-medium">{request.preferred_time || "-"}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 border-b pb-3">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Alamat</p>
                    <p className="text-foreground whitespace-pre-wrap">{request.address}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pb-2">
                <div className="flex items-start gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Keluhan</p>
                    <p className="text-foreground whitespace-pre-wrap">{request.complaint}</p>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  onClick={handlePayment}
                  disabled={paymentMethod !== "cash" || submitting}
                  className="w-full medical-gradient text-primary-foreground font-semibold flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    <>
                      Bayar & Lanjutkan
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
