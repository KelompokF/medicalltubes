import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { Send, Loader2, MessageCircle, User, XCircle, Lock, AlertTriangle, Heart, Pill, Stethoscope, CalendarDays, Droplets, ClipboardList } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import api, { API_BASE_URL, prescriptionService, doctorService } from "@/services/api";
import { toast } from "sonner";
import ReportModal from "@/components/ReportModal";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, FileText, Check, CheckCheck, Activity } from "lucide-react";

interface ChatMessage {
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  is_read?: boolean;
}

interface Room {
  room_id: string;
  partner_id: string;
  partner_name: string;
  partner_role: string;
  status: string;
  last_message?: string;
  last_date?: string;
  message_count: number;
}

export default function DoctorConsultationPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const roomIdFromUrl = searchParams.get("room_id");
  // Current doctor info
  const user =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user") || "null")
      : null;
  const doctorId = user?.id || user?.sub || null;

  // State
  const [rooms, setRooms] = useState<Room[]>([]);
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState("");
  const [showSidebar, setShowSidebar] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
  const [prescriptionForm, setPrescriptionForm] = useState({
    notes: "",
    medications: [{ name: "", dosage: "", duration: "", instructions: "" }],
  });
  const [isSubmittingPrescription, setIsSubmittingPrescription] = useState(false);

  // Patient Info State
  const [isPatientInfoModalOpen, setIsPatientInfoModalOpen] = useState(false);
  const [patientSummary, setPatientSummary] = useState<any>(null);
  const [isLoadingPatientInfo, setIsLoadingPatientInfo] = useState(false);
  const [patientInfoTab, setPatientInfoTab] = useState<"overview" | "records">("overview");
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const fetchPatientInfo = async () => {
    if (!activeRoom?.partner_id) return;
    setIsLoadingPatientInfo(true);
    try {
      const res = await doctorService.getPatientSummary(activeRoom.partner_id);
      setPatientSummary(res.data);
    } catch (err) {
      toast.error(t("doctor.consultation.patientInfoError", "Gagal memuat info pasien"));
    } finally {
      setIsLoadingPatientInfo(false);
    }
  };

  const handleOpenPatientInfo = (open: boolean) => {
    setIsPatientInfoModalOpen(open);
    if (open) {
      setPatientInfoTab("overview");
      fetchPatientInfo();
    }
  };

  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const refreshRooms = async () => {
    if (!doctorId) return;
    try {
      const res = await api.get("/chat/rooms");
      if (Array.isArray(res.data)) {
        setRooms(res.data);
      }
    } catch (err) {
      console.error("Failed to refresh rooms:", err);
    }
  };

  // Auto-select room when URL param changes or rooms load
  useEffect(() => {
    if (roomIdFromUrl && rooms.length > 0) {
      const room = rooms.find((r) => r.room_id === roomIdFromUrl);
      if (room && room.room_id !== activeRoom?.room_id) {
        setActiveRoom(room);
        setSessionEnded(room.status === "ended");
      }
    }
  }, [roomIdFromUrl, rooms, activeRoom]);

  // Load room list
  useEffect(() => {
    refreshRooms();
  }, [doctorId]);

  // Load messages when active room changes
  useEffect(() => {
    const loadMessages = async () => {
      if (!activeRoom) return;
      setIsLoadingHistory(true);
      try {
        const res = await api.get(`/chat/room/${activeRoom.room_id}/messages`);
        if (Array.isArray(res.data)) {
          setMessages(res.data);
          
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: "read_receipt", room_id: activeRoom.room_id, sender_id: activeRoom.partner_id }));
          }
        }
      } catch {
        setMessages([]);
      } finally {
        setIsLoadingHistory(false);
      }
    };
    loadMessages();
  }, [activeRoom?.room_id]);

  // WebSocket connection
  useEffect(() => {
    if (!doctorId) return;

    const wsBaseUrl = API_BASE_URL.replace(/^http/, "ws");
    const wsUrl = `${wsBaseUrl}/ws/chat/${doctorId}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket connected", wsUrl);
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "end_session") {
          if (activeRoom && data.room_id === activeRoom.room_id) {
            setSessionEnded(true);
          }
          toast.info(t("doctor.consultation.sessionEndedToast", "Sesi konsultasi telah diakhiri."));
          return;
        }

        if (data.type === "read_receipt_update") {
          if (activeRoom && data.room_id === activeRoom.room_id) {
            setMessages(prev => prev.map(m => m.sender_id === doctorId ? { ...m, is_read: true } : m));
          }
          return;
        }

        // Only add if for current active room
        if (
          activeRoom &&
          (data.sender_id === activeRoom.partner_id ||
            data.receiver_id === activeRoom.partner_id)
        ) {
          setMessages((prev) => [...prev, data]);
          
          if (data.sender_id === activeRoom.partner_id && data.receiver_id === doctorId) {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: "read_receipt", room_id: activeRoom.room_id, sender_id: activeRoom.partner_id }));
            }
          }
        }

        // Always refresh rooms to show latest message/new patients in sidebar
        refreshRooms();
      } catch (e) {
        console.error("Invalid WS message", e);
      }
    };

    ws.onclose = () => {
      console.log("WebSocket closed");
      setIsConnected(false);
    };
    ws.onerror = (e) => console.error("WebSocket error", e);

    return () => {
      ws.close();
      wsRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctorId, activeRoom?.room_id]);

  const handleSend = () => {
    if (!message.trim() || !activeRoom || sessionEnded) return;

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          room_id: activeRoom.room_id,
          receiver_id: activeRoom.partner_id,
          content: message,
        })
      );
    } else {
      console.warn("WebSocket not connected");
    }

    setMessage("");
  };

  const handleEndSession = async () => {
    if (!activeRoom) return;
    try {
      await api.post(`/chat/room/${activeRoom.room_id}/end`);
      setSessionEnded(true);
      toast.success(t("doctor.consultation.sessionEndedSuccess", "Sesi konsultasi telah diakhiri."));
      // Update room list
      setRooms((prev) =>
        prev.map((r) =>
          r.room_id === activeRoom.room_id ? { ...r, status: "ended" } : r
        )
      );
    } catch (err) {
      toast.error(t("doctor.consultation.endSessionFailed", "Gagal mengakhiri sesi."));
    }
  };

  const selectRoom = (room: Room) => {
    setActiveRoom(room);
    setSessionEnded(room.status === "ended");
    setShowSidebar(false);
  };

  const addMedication = () => {
    setPrescriptionForm((prev) => ({
      ...prev,
      medications: [
        ...prev.medications,
        { name: "", dosage: "", duration: "", instructions: "" },
      ],
    }));
  };

  const removeMedication = (index: number) => {
    setPrescriptionForm((prev) => ({
      ...prev,
      medications: prev.medications.filter((_, i) => i !== index),
    }));
  };

  const handleMedicationChange = (index: number, field: string, value: string) => {
    setPrescriptionForm((prev) => {
      const newMeds = [...prev.medications];
      newMeds[index] = { ...newMeds[index], [field]: value };
      return { ...prev, medications: newMeds };
    });
  };

  const submitPrescription = async () => {
    if (!activeRoom) return;
    
    // Validasi
    const isValid = prescriptionForm.medications.every(m => m.name && m.dosage);
    if (!isValid) {
      toast.error(t("doctor.consultation.prescriptionValidation", "Harap isi nama obat dan dosis"));
      return;
    }

    setIsSubmittingPrescription(true);
    try {
      await prescriptionService.create({
        room_id: activeRoom.room_id,
        patient_id: activeRoom.partner_id,
        medications: prescriptionForm.medications,
        notes: prescriptionForm.notes
      });
      
      toast.success(t("doctor.consultation.prescriptionCreated", "Resep obat berhasil dibuat"));
      setIsPrescriptionModalOpen(false);
      setPrescriptionForm({
        notes: "",
        medications: [{ name: "", dosage: "", duration: "", instructions: "" }],
      });
    } catch (err) {
      toast.error(t("doctor.consultation.prescriptionFailed", "Gagal membuat resep obat"));
    } finally {
      setIsSubmittingPrescription(false);
    }
  };

  const formatTime = (isoStr?: string) => {
    if (!isoStr) return "";
    return new Date(isoStr).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // No user logged in
  if (!doctorId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
        <MessageCircle className="h-8 w-8 text-muted-foreground mb-3" />
        <p className="text-muted-foreground mb-4">
          {t("doctor.consultation.loginRequired", "Silakan login untuk melihat daftar konsultasi.")}
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in h-[calc(100vh-140px)] flex rounded-xl shadow-card overflow-hidden bg-card border border-border/50">
      {/* Sidebar */}
      <div
        className={`${
          showSidebar ? "block" : "hidden"
        } md:block w-full md:w-80 border-r border-border/50 flex-shrink-0 bg-muted/10`}
      >
        <div className="p-4 border-b border-border/50 bg-card">
          <h2 className="font-semibold text-lg text-foreground mb-1">
            {t("doctor.consultation.patientList", "Daftar Pasien")}
          </h2>
          <p className="text-xs text-muted-foreground">{t("doctor.consultation.patientListDesc", "Pesan konsultasi yang masuk")}</p>
        </div>
        <div className="overflow-y-auto h-[calc(100%-70px)]">
          {rooms.length === 0 && (
            <div className="p-8 text-center text-sm text-muted-foreground flex flex-col items-center">
              <div className="bg-primary/10 p-3 rounded-full mb-3">
                <User className="h-6 w-6 text-primary" />
              </div>
              <p className="font-medium text-foreground mb-1">{t("doctor.consultation.noMessages", "Belum ada pesan masuk.")}</p>
              <p className="text-xs">{t("doctor.consultation.noMessagesDesc", "Pasien yang menghubungi Anda akan muncul di sini.")}</p>
            </div>
          )}
          {rooms.map((room) => (
            <button
              key={room.room_id}
              onClick={() => selectRoom(room)}
              className={`w-full flex items-center gap-3 p-4 transition-colors border-b border-border/50 last:border-0 ${
                activeRoom?.room_id === room.room_id
                  ? "bg-primary/10 border-l-4 border-l-primary"
                  : "hover:bg-muted/50 border-l-4 border-l-transparent"
              }`}
            >
              <div className="h-10 w-10 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-sm font-bold shrink-0">
                {room.partner_name
                  .split(" ")
                  .filter((n) => n.length > 0)
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-medium text-sm text-foreground block truncate">
                    {room.partner_name}
                  </span>
                  <div className="flex items-center gap-1 shrink-0 ml-1">
                    {room.status === "ended" && (
                      <Badge variant="secondary" className="text-[10px]">Ended</Badge>
                    )}
                    {room.last_date && (
                      <span className="text-[10px] text-muted-foreground">
                        {formatTime(room.last_date)}
                      </span>
                    )}
                  </div>
                </div>
                {room.last_message && (
                  <p className="text-xs text-muted-foreground truncate">{room.last_message}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0 bg-background/50">
        {/* Top bar */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-border/50 bg-card">
          <button
            className="md:hidden p-2 -ml-2 rounded-md hover:bg-muted text-muted-foreground"
            onClick={() => setShowSidebar(!showSidebar)}
          >
            ☰
          </button>
          {activeRoom ? (
            <div className="flex items-center gap-3 w-full">
              <div className="h-10 w-10 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-sm font-bold shrink-0 shadow-sm">
                {activeRoom.partner_name
                  .split(" ")
                  .filter((n) => n.length > 0)
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm text-foreground">
                  {activeRoom.partner_name}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {sessionEnded ? (
                    <><Lock className="h-3 w-3 text-muted-foreground" /><span className="text-[10px] text-muted-foreground font-medium">{t("doctor.consultation.sessionEnded", "Sesi Berakhir")}</span></>
                  ) : (
                    <>
                      <span className="relative flex h-2 w-2">
                        {isConnected && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>}
                        <span className={`relative inline-flex rounded-full h-2 w-2 ${isConnected ? "bg-success" : "bg-muted-foreground"}`}></span>
                      </span>
                      <span className="text-[10px] uppercase font-medium tracking-wider text-muted-foreground">
                        {isConnected ? t("doctor.consultation.connected", "Connected") : t("doctor.consultation.disconnected", "Disconnected")}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <Lock className="h-3 w-3 text-success" />
                  <span className="text-[10px] text-success font-medium hidden sm:inline">{t("doctor.consultation.encrypted", "Encrypted")}</span>
                </div>
                {/* Info Pasien — tersedia selalu (termasuk saat sesi ended) */}
                <div className="flex items-center gap-1">
                    <Dialog open={isPatientInfoModalOpen} onOpenChange={handleOpenPatientInfo}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-1.5 text-blue-600 border-blue-200 hover:bg-blue-50 dark:border-blue-800 dark:hover:bg-blue-950">
                          <Activity className="h-4 w-4" />
                          <span className="hidden sm:inline">{t("doctor.consultation.patientInfo", "Info Pasien")}</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-hidden flex flex-col">
                        <DialogHeader className="pb-3 border-b">
                          <DialogTitle className="flex items-center gap-2">
                            <Stethoscope className="h-5 w-5 text-blue-600" />
                            {t("doctor.consultation.patientMedicalRecord", "Rekam Medis Pasien")}
                          </DialogTitle>
                          <DialogDescription>
                            {patientSummary?.profile?.full_name
                              ? t("doctor.consultation.patientHealthDataOf", { name: patientSummary.profile.full_name })
                              : t("doctor.consultation.patientHealthDataDesc", "Data kesehatan pasien untuk membantu diagnosis yang lebih tepat.")}
                          </DialogDescription>
                        </DialogHeader>

                        {isLoadingPatientInfo ? (
                          <div className="flex justify-center items-center py-16">
                            <div className="flex flex-col items-center gap-3">
                              <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                              <p className="text-sm text-muted-foreground">{t("doctor.consultation.loadingPatientData", "Memuat data pasien...")}</p>
                            </div>
                          </div>
                        ) : patientSummary ? (
                          <div className="flex flex-col flex-1 overflow-hidden">
                            {/* TAB NAVIGATION */}
                            <div className="flex border-b my-3">
                              <button
                                onClick={() => setPatientInfoTab("overview")}
                                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                                  patientInfoTab === "overview"
                                    ? "border-blue-600 text-blue-600"
                                    : "border-transparent text-muted-foreground hover:text-foreground"
                                }`}
                              >
                                {t("doctor.consultation.summary", "Ringkasan")}
                              </button>
                              <button
                                onClick={() => setPatientInfoTab("records")}
                                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
                                  patientInfoTab === "records"
                                    ? "border-blue-600 text-blue-600"
                                    : "border-transparent text-muted-foreground hover:text-foreground"
                                }`}
                              >
                                {t("doctor.consultation.medicalRecordHistory", "Riwayat Rekam Medis")}
                                {patientSummary.total_records > 0 && (
                                  <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                    {patientSummary.total_records}
                                  </span>
                                )}
                              </button>
                            </div>

                            <div className="overflow-y-auto flex-1 pr-1">
                              {patientInfoTab === "overview" && (
                                <div className="space-y-4">
                                  {/* Profil Dasar */}
                                  <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 rounded-lg bg-muted/30 border">
                                      <span className="text-xs text-muted-foreground flex items-center gap-1 mb-1"><User className="h-3 w-3" />{t("common.fullName", "Nama Lengkap")}</span>
                                      <p className="font-semibold text-sm">{patientSummary.profile.full_name || '-'}</p>
                                    </div>
                                    <div className="p-3 rounded-lg bg-muted/30 border">
                                      <span className="text-xs text-muted-foreground flex items-center gap-1 mb-1"><Droplets className="h-3 w-3" />{t("common.bloodType", "Golongan Darah")}</span>
                                      <p className="font-semibold text-sm">{patientSummary.profile.blood_type || <span className="text-muted-foreground italic font-normal">{t("common.notFilled", "Belum diisi")}</span>}</p>
                                    </div>
                                    <div className="p-3 rounded-lg bg-muted/30 border">
                                      <span className="text-xs text-muted-foreground flex items-center gap-1 mb-1"><CalendarDays className="h-3 w-3" />{t("common.dob", "Tanggal Lahir")}</span>
                                      <p className="font-semibold text-sm">
                                        {patientSummary.profile.date_of_birth
                                          ? new Date(patientSummary.profile.date_of_birth).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                                          : <span className="text-muted-foreground italic font-normal">{t("common.notFilled", "Belum diisi")}</span>}
                                      </p>
                                    </div>
                                    <div className="p-3 rounded-lg bg-muted/30 border">
                                      <span className="text-xs text-muted-foreground flex items-center gap-1 mb-1"><ClipboardList className="h-3 w-3" />{t("doctor.consultation.totalMedicalRecords", "Total Rekam Medis")}</span>
                                      <p className="font-semibold text-sm">{patientSummary.total_records} {t("doctor.consultation.recordsCount", "catatan")}</p>
                                    </div>
                                  </div>

                                  {/* ALERGI — ditampilkan menonjol */}
                                  {patientSummary.latest_allergies ? (
                                    <div className="p-4 rounded-lg bg-red-50 border border-red-200 dark:bg-red-950/30 dark:border-red-800">
                                      <div className="flex items-center gap-2 mb-2">
                                        <AlertTriangle className="h-4 w-4 text-red-600" />
                                        <span className="font-semibold text-red-700 dark:text-red-400 text-sm">{t("doctor.consultation.allergyWarning", "PERINGATAN ALERGI")}</span>
                                      </div>
                                      <p className="text-red-800 dark:text-red-300 font-medium text-sm">{patientSummary.latest_allergies}</p>
                                    </div>
                                  ) : (
                                    <div className="p-3 rounded-lg bg-green-50 border border-green-200 dark:bg-green-950/30 dark:border-green-800 flex items-center gap-2">
                                      <Heart className="h-4 w-4 text-green-600" />
                                      <span className="text-green-700 dark:text-green-400 text-sm font-medium">{t("doctor.consultation.noAllergies", "Tidak ada riwayat alergi yang tercatat")}</span>
                                    </div>
                                  )}

                                  {/* Kondisi & Obat Terkini */}
                                  <div className="grid grid-cols-1 gap-3">
                                    <div className="p-3 rounded-lg border bg-muted/20">
                                      <span className="text-xs text-muted-foreground flex items-center gap-1 mb-1"><Stethoscope className="h-3 w-3" />{t("doctor.consultation.currentConditions", "Kondisi/Penyakit Terkini")}</span>
                                      <p className="text-sm font-medium">{patientSummary.latest_conditions || <span className="italic text-muted-foreground font-normal">{t("common.noData", "Tidak ada data")}</span>}</p>
                                    </div>
                                    <div className="p-3 rounded-lg border bg-muted/20">
                                      <span className="text-xs text-muted-foreground flex items-center gap-1 mb-1"><Pill className="h-3 w-3" />{t("doctor.consultation.currentMedications", "Obat yang Sedang Dikonsumsi")}</span>
                                      <p className="text-sm font-medium">{patientSummary.latest_medications || <span className="italic text-muted-foreground font-normal">{t("common.noData", "Tidak ada data")}</span>}</p>
                                    </div>
                                  </div>

                                  {/* Tanda Vital Terkini */}
                                  {patientSummary.latest_vitals && (
                                    <div className="space-y-2">
                                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{t("doctor.consultation.lastVitals", "Tanda Vital Terakhir")}</p>
                                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                        {patientSummary.latest_vitals.blood_pressure && (
                                          <div className="p-2.5 rounded-lg border bg-blue-50 dark:bg-blue-950/20 text-center">
                                            <p className="text-[10px] text-muted-foreground mb-0.5">{t("doctor.consultation.bloodPressure", "Tekanan Darah")}</p>
                                            <p className="font-bold text-sm text-blue-700 dark:text-blue-400">{patientSummary.latest_vitals.blood_pressure}</p>
                                          </div>
                                        )}
                                        {patientSummary.latest_vitals.heart_rate && (
                                          <div className="p-2.5 rounded-lg border bg-red-50 dark:bg-red-950/20 text-center">
                                            <p className="text-[10px] text-muted-foreground mb-0.5">{t("doctor.consultation.heartRate", "Detak Jantung")}</p>
                                            <p className="font-bold text-sm text-red-700 dark:text-red-400">{patientSummary.latest_vitals.heart_rate} bpm</p>
                                          </div>
                                        )}
                                        {patientSummary.latest_vitals.weight && (
                                          <div className="p-2.5 rounded-lg border bg-orange-50 dark:bg-orange-950/20 text-center">
                                            <p className="text-[10px] text-muted-foreground mb-0.5">{t("doctor.consultation.weight", "Berat Badan")}</p>
                                            <p className="font-bold text-sm text-orange-700 dark:text-orange-400">{patientSummary.latest_vitals.weight} kg</p>
                                          </div>
                                        )}
                                        {patientSummary.latest_vitals.height && (
                                          <div className="p-2.5 rounded-lg border bg-purple-50 dark:bg-purple-950/20 text-center">
                                            <p className="text-[10px] text-muted-foreground mb-0.5">{t("doctor.consultation.height", "Tinggi Badan")}</p>
                                            <p className="font-bold text-sm text-purple-700 dark:text-purple-400">{patientSummary.latest_vitals.height} cm</p>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}

                              {patientInfoTab === "records" && (
                                <div className="space-y-3">
                                  {patientSummary.health_records.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-center">
                                      <ClipboardList className="h-12 w-12 text-muted-foreground/30 mb-3" />
                                      <p className="text-sm font-medium text-muted-foreground">{t("doctor.consultation.noMedicalRecords", "Belum ada rekam medis")}</p>
                                      <p className="text-xs text-muted-foreground/70 mt-1">{t("doctor.consultation.noMedicalRecordsDesc", "Pasien belum menambahkan catatan kesehatan apapun.")}</p>
                                    </div>
                                  ) : (
                                    patientSummary.health_records.map((record: any, idx: number) => (
                                      <div key={idx} className="p-4 rounded-lg border bg-card space-y-3">
                                        <div className="flex items-center justify-between">
                                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                            {new Date(record.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                          </Badge>
                                          {idx === 0 && <Badge className="bg-green-100 text-green-700 border-0 text-[10px]">{t("common.latest", "Terbaru")}</Badge>}
                                        </div>
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                          <div>
                                            <p className="text-[11px] text-muted-foreground mb-0.5">{t("doctor.consultation.diagnosedConditions", "Diagnosa/Kondisi")}</p>
                                            <p className="font-medium text-sm">{record.diagnosed_conditions || <span className="text-muted-foreground italic font-normal">-</span>}</p>
                                          </div>
                                          <div>
                                            <p className="text-[11px] text-muted-foreground mb-0.5">{t("doctor.consultation.allergies", "Alergi")}</p>
                                            <p className={`font-medium text-sm ${record.allergies ? 'text-red-600' : 'text-muted-foreground italic font-normal'}`}>{record.allergies || '-'}</p>
                                          </div>
                                          <div>
                                            <p className="text-[11px] text-muted-foreground mb-0.5">{t("doctor.consultation.medicationsConsumed", "Obat Dikonsumsi")}</p>
                                            <p className="font-medium text-sm">{record.current_medications || <span className="text-muted-foreground italic font-normal">-</span>}</p>
                                          </div>
                                          <div>
                                            <p className="text-[11px] text-muted-foreground mb-0.5">{t("common.notes", "Catatan")}</p>
                                            <p className="font-medium text-sm">{record.notes || <span className="text-muted-foreground italic font-normal">-</span>}</p>
                                          </div>
                                        </div>
                                        {(record.blood_pressure || record.heart_rate || record.weight || record.height) && (
                                          <div className="grid grid-cols-4 gap-2 pt-2 border-t">
                                            {record.blood_pressure && <div className="text-center"><p className="text-[10px] text-muted-foreground">{t("doctor.consultation.bp", "Tensi")}</p><p className="text-xs font-bold">{record.blood_pressure}</p></div>}
                                            {record.heart_rate && <div className="text-center"><p className="text-[10px] text-muted-foreground">{t("doctor.consultation.hr", "Nadi")}</p><p className="text-xs font-bold">{record.heart_rate} bpm</p></div>}
                                            {record.weight && <div className="text-center"><p className="text-[10px] text-muted-foreground">{t("doctor.consultation.wt", "BB")}</p><p className="text-xs font-bold">{record.weight} kg</p></div>}
                                            {record.height && <div className="text-center"><p className="text-[10px] text-muted-foreground">{t("doctor.consultation.ht", "TB")}</p><p className="text-xs font-bold">{record.height} cm</p></div>}
                                          </div>
                                        )}
                                      </div>
                                    ))
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-12">
                            <User className="h-12 w-12 text-muted-foreground/30 mb-3" />
                            <p className="text-sm text-muted-foreground">{t("doctor.consultation.patientDataNotAvailable", "Data pasien tidak tersedia")}</p>
                          </div>
                        )}

                        <DialogFooter className="pt-3 border-t mt-3">
                          <Button variant="outline" onClick={() => setIsPatientInfoModalOpen(false)}>{t("common.close", "Tutup")}</Button>
                         </DialogFooter>
                      </DialogContent>
                    </Dialog>
                 </div>
                 {!sessionEnded && (
                   <div className="flex items-center gap-1">
                    <Dialog open={isPrescriptionModalOpen} onOpenChange={setIsPrescriptionModalOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-1.5 text-primary border-primary/20 hover:bg-primary/5">
                          <FileText className="h-4 w-4" />
                          <span className="hidden sm:inline">{t("doctor.consultation.prescription", "Resep Obat")}</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>{t("doctor.consultation.createPrescription", "Buat Resep Obat")}</DialogTitle>
                          <DialogDescription>
                            {t("doctor.consultation.prescriptionDesc", "Resep ini akan dikirimkan ke pasien dan tersimpan di riwayat konsultasi.")}
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-6 py-4">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <Label className="text-base font-semibold">{t("doctor.consultation.medicationList", "Daftar Obat")}</Label>
                              <Button type="button" variant="outline" size="sm" onClick={addMedication} className="h-8 gap-1">
                                <Plus className="h-3.5 w-3.5" /> {t("common.add", "Tambah")}
                              </Button>
                            </div>
                            
                            {prescriptionForm.medications.map((med, idx) => (
                              <div key={idx} className="p-4 rounded-lg border bg-muted/30 space-y-3 relative">
                                {prescriptionForm.medications.length > 1 && (
                                  <Button 
                                    type="button" 
                                    variant="ghost" 
                                    size="icon" 
                                    className="absolute top-2 right-2 h-7 w-7 text-destructive hover:bg-destructive/10"
                                    onClick={() => removeMedication(idx)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                                
                                <div className="grid gap-2">
                                  <Label htmlFor={`med-name-${idx}`}>{t("doctor.consultation.medicationName", "Nama Obat")}</Label>
                                  <Input 
                                    id={`med-name-${idx}`}
                                    placeholder={t("doctor.consultation.medicationNamePlaceholder", "Contoh: Amoxicillin 500mg")} 
                                    value={med.name}
                                    onChange={(e) => handleMedicationChange(idx, "name", e.target.value)}
                                  />
                                </div>
                                
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="grid gap-2">
                                    <Label htmlFor={`med-dosage-${idx}`}>{t("doctor.consultation.dosage", "Dosis")}</Label>
                                    <Input 
                                      id={`med-dosage-${idx}`}
                                      placeholder={t("doctor.consultation.dosagePlaceholder", "Contoh: 3 x 1")} 
                                      value={med.dosage}
                                      onChange={(e) => handleMedicationChange(idx, "dosage", e.target.value)}
                                    />
                                  </div>
                                  <div className="grid gap-2">
                                    <Label htmlFor={`med-duration-${idx}`}>{t("doctor.consultation.duration", "Durasi")}</Label>
                                    <Input 
                                      id={`med-duration-${idx}`}
                                      placeholder={t("doctor.consultation.durationPlaceholder", "Contoh: 5 hari")} 
                                      value={med.duration}
                                      onChange={(e) => handleMedicationChange(idx, "duration", e.target.value)}
                                    />
                                  </div>
                                </div>
                                
                                <div className="grid gap-2">
                                  <Label htmlFor={`med-instr-${idx}`}>{t("doctor.consultation.instructions", "Aturan Pakai")}</Label>
                                  <Input 
                                    id={`med-instr-${idx}`}
                                    placeholder={t("doctor.consultation.instructionsPlaceholder", "Contoh: Sesudah makan")} 
                                    value={med.instructions}
                                    onChange={(e) => handleMedicationChange(idx, "instructions", e.target.value)}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          <div className="grid gap-2">
                            <Label htmlFor="prescription-notes">{t("doctor.consultation.additionalNotes", "Catatan Tambahan (Opsional)")}</Label>
                            <Textarea 
                              id="prescription-notes"
                              placeholder={t("doctor.consultation.additionalNotesPlaceholder", "Ketik catatan tambahan di sini...")} 
                              className="min-h-[100px]"
                              value={prescriptionForm.notes}
                              onChange={(e) => setPrescriptionForm(prev => ({ ...prev, notes: e.target.value }))}
                            />
                          </div>
                        </div>
                        
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsPrescriptionModalOpen(false)}>{t("common.cancel", "Batal")}</Button>
                          <Button onClick={submitPrescription} disabled={isSubmittingPrescription}>
                            {isSubmittingPrescription ? (
                              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> {t("common.sending", "Mengirim...")}</>
                            ) : (
                              t("doctor.consultation.sendPrescription", "Kirim Resep")
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1">
                          <XCircle className="h-4 w-4" />
                          <span className="hidden sm:inline">{t("doctor.consultation.endSession", "Akhiri Sesi")}</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t("doctor.consultation.endSessionTitle", "Akhiri Sesi Konsultasi?")}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {t("doctor.consultation.endSessionDesc", "Tindakan ini akan mengakhiri sesi chat dengan pasien. Riwayat chat tetap tersimpan dengan aman (terenkripsi).")}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t("common.cancel", "Batal")}</AlertDialogCancel>
                          <AlertDialogAction onClick={handleEndSession} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            {t("doctor.consultation.endSessionBtn", "Akhiri Sesi")}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
                {/* Report Patient Button — always visible */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-amber-600 hover:bg-amber-50 hover:text-amber-700 dark:hover:bg-amber-950/30"
                  onClick={() => setIsReportModalOpen(true)}
                  title={t("doctor.consultation.reportPatient", "Laporkan pasien ini")}
                >
                  <AlertTriangle className="h-4 w-4" />
                  <span className="hidden sm:inline">{t("common.report", "Report")}</span>
                </Button>
              </div>
              {activeRoom && (
                <ReportModal
                  open={isReportModalOpen}
                  onOpenChange={setIsReportModalOpen}
                  reportedId={activeRoom.partner_id}
                  reportedName={activeRoom.partner_name}
                  contextType="consultation"
                  contextId={activeRoom.room_id}
                />
              )}
            </div>
          ) : (
            <p className="font-semibold text-sm text-muted-foreground">
              {t("doctor.consultation.selectPatient", "Pilih pasien untuk melihat percakapan")}
            </p>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {!activeRoom && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <MessageCircle className="h-16 w-16 text-muted/50 mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-1">{t("doctor.consultation.chatRoom", "Ruang Konsultasi Dokter")}</h3>
              <p className="text-muted-foreground text-sm max-w-sm">
                {t("doctor.consultation.chatRoomDesc", "Pilih pasien dari daftar di sebelah kiri untuk mulai membalas pesan mereka.")}
              </p>
            </div>
          )}

          {activeRoom && isLoadingHistory && (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                <span className="text-sm font-medium text-muted-foreground">
                  {t("doctor.consultation.loadingChat", "Memuat percakapan...")}
                </span>
              </div>
            </div>
          )}

          {activeRoom && !isLoadingHistory && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Badge variant="outline" className="mb-4 bg-muted/50 text-muted-foreground border-border">{t("doctor.consultation.newConversation", "Percakapan Baru")}</Badge>
              <p className="text-muted-foreground text-sm">
                {t("doctor.consultation.newConversationDesc", "Sapa pasien Anda untuk memulai sesi konsultasi.")}
              </p>
              <p className="text-[10px] text-success mt-2 flex items-center gap-1">
                <Lock className="h-3 w-3" /> {t("doctor.consultation.e2eEncrypted", "Pesan terenkripsi end-to-end")}
              </p>
            </div>
          )}

          {messages.map((msg, idx) => {
            const isDoctor = msg.sender_id === doctorId;
            return (
              <div
                key={idx}
                className={`flex ${
                  isDoctor ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[75%] px-4 py-3 text-sm shadow-sm ${
                    isDoctor
                      ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm"
                      : "bg-card border border-border/50 text-foreground rounded-2xl rounded-tl-sm"
                  }`}
                >
                  <p className="leading-relaxed">{msg.content}</p>
                  <div
                    className={`flex items-center justify-end gap-1 mt-1.5 ${
                      isDoctor
                        ? "text-primary-foreground/70"
                        : "text-muted-foreground/70"
                    }`}
                  >
                    <span className="text-[10px] font-medium">{formatTime(msg.created_at)}</span>
                    {isDoctor && (
                      msg.is_read ? (
                        <CheckCheck className="h-3 w-3 text-blue-300" />
                      ) : (
                        <Check className="h-3 w-3" />
                      )
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        {activeRoom && (
          <div className="p-4 bg-card border-t border-border/50">
            {sessionEnded ? (
              <div className="bg-muted/50 rounded-lg p-3 text-center border border-dashed">
                <p className="text-sm text-muted-foreground font-medium">{t("doctor.consultation.sessionEndedDesc", "Sesi konsultasi ini telah berakhir.")}</p>
              </div>
            ) : (
              <div className="flex items-center gap-3 bg-muted/30 rounded-full border border-border/50 p-1 pl-4 focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-all shadow-inner">
                <Input
                  placeholder={t("doctor.consultation.replyPlaceholder", "Balas pasien...")}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  className="flex-1 bg-transparent border-0 focus-visible:ring-0 shadow-none px-0 h-10"
                  disabled={!isConnected}
                />
                <Button
                  size="icon"
                  onClick={handleSend}
                  disabled={!message.trim() || !isConnected}
                  className="h-10 w-10 rounded-full shrink-0 transition-transform active:scale-95"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            )}
            {!isConnected && !sessionEnded && (
              <p className="text-[10px] font-medium text-warning flex items-center justify-center gap-1 mt-2">
                <span className="relative flex h-1.5 w-1.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-warning opacity-75"></span><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-warning"></span></span>
                {t("doctor.consultation.disconnectedReconnecting", "Koneksi terputus. Mencoba menghubungkan ulang...")}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
