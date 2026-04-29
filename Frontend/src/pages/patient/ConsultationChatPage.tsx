import { useEffect, useRef, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Send, Loader2, MessageCircle, Lock, FileText, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import api, { prescriptionService } from "@/services/api";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Medication {
  name: string;
  dosage: string;
  duration: string;
  instructions: string;
}

interface Prescription {
  id: string;
  medications: Medication[];
  notes?: string;
  created_at: string;
}

interface ChatMessage {
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
}

interface Room {
  room_id: string;
  partner_id: string;
  partner_name: string;
  status: string;
  last_message?: string;
  last_date?: string;
  message_count: number;
}

export default function ConsultationChatPage() {
  const [searchParams] = useSearchParams();
  const doctorIdFromUrl = searchParams.get("doctor_id");
  const doctorNameFromUrl = searchParams.get("doctor_name");
  const roomIdFromUrl = searchParams.get("room_id");

  // Current user info
  const user =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user") || "null")
      : null;
  const userId = user?.id || user?.sub || null;

  // State
  const [rooms, setRooms] = useState<Room[]>([]);
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState("");
  const [showSidebar, setShowSidebar] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-create room if coming from search-doctor page
  useEffect(() => {
    const createRoom = async () => {
      if (!doctorIdFromUrl || !userId) return;
      try {
        const res = await api.post("/chat/room", { doctor_id: doctorIdFromUrl });
        const room: Room = {
          room_id: res.data.room_id,
          partner_id: res.data.doctor_id,
          partner_name: res.data.doctor_name || doctorNameFromUrl || "Dokter",
          status: res.data.status,
          message_count: 0,
        };
        setActiveRoom(room);
        setSessionEnded(room.status === "ended");
        // Add to room list if not there
        setRooms((prev) => {
          const exists = prev.find((r) => r.room_id === room.room_id);
          if (!exists) return [room, ...prev];
          return prev;
        });
      } catch (err) {
        console.error("Failed to create room:", err);
        toast.error("Gagal memulai sesi chat. Silakan coba lagi.");
      }
    };
    createRoom();
  }, [doctorIdFromUrl, userId, doctorNameFromUrl]);

  // Load room list
  useEffect(() => {
    const loadRooms = async () => {
      if (!userId) return;
      try {
        const res = await api.get("/chat/rooms");
        if (Array.isArray(res.data)) {
          setRooms(res.data);
          
          // Auto-select room from URL param room_id
          if (roomIdFromUrl) {
            const room = res.data.find((r: Room) => r.room_id === roomIdFromUrl);
            if (room) {
              setActiveRoom(room);
              setSessionEnded(room.status === "ended");
            }
          } 
          // Else auto-select first room if none selected and no doctor_id param
          else if (!activeRoom && !doctorIdFromUrl && res.data.length > 0) {
            setActiveRoom(res.data[0]);
            setSessionEnded(res.data[0].status === "ended");
          }
        }
      } catch (err) {
        console.error("Failed to load rooms:", err);
      }
    };
    loadRooms();
  }, [userId]);

  // Load messages and prescriptions when active room changes
  useEffect(() => {
    const loadData = async () => {
      if (!activeRoom) return;
      setIsLoadingHistory(true);
      try {
        // Load messages
        const msgRes = await api.get(`/chat/room/${activeRoom.room_id}/messages`);
        if (Array.isArray(msgRes.data)) {
          setMessages(msgRes.data);
        }
        
        // Load prescriptions
        const presRes = await prescriptionService.getRoomPrescriptions(activeRoom.room_id);
        if (Array.isArray(presRes.data)) {
          setPrescriptions(presRes.data);
        }
      } catch {
        setMessages([]);
      } finally {
        setIsLoadingHistory(false);
      }
    };
    loadData();
  }, [activeRoom?.room_id]);

  // WebSocket connection
  useEffect(() => {
    if (!userId) return;

    const port = window.location.hostname === "localhost" ? "8001" : window.location.port;
    const wsUrl = `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.hostname}:${port}/ws/chat/${userId}`;
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
          setSessionEnded(true);
          toast.info("Sesi konsultasi telah diakhiri oleh dokter.");
          return;
        }

        if (data.type === "new_prescription") {
          toast.success("Dokter telah mengirimkan resep obat baru!", {
            description: "Klik untuk melihat detail resep.",
            action: {
              label: "Lihat",
              onClick: () => setIsPrescriptionModalOpen(true)
            }
          });
          // Refresh prescriptions
          if (activeRoom) {
            prescriptionService.getRoomPrescriptions(activeRoom.room_id).then(res => {
              if (Array.isArray(res.data)) setPrescriptions(res.data);
            });
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
        }
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
  }, [userId, activeRoom?.room_id]);

  const handleSend = () => {
    if (!message.trim() || !activeRoom || sessionEnded) return;

    // Send via WebSocket
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

  const selectRoom = (room: Room) => {
    setActiveRoom(room);
    setSessionEnded(room.status === "ended");
    setShowSidebar(false);
  };

  const formatTime = (isoStr?: string) => {
    if (!isoStr) return "";
    return new Date(isoStr).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // No user logged in
  if (!userId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
        <MessageCircle className="h-8 w-8 text-muted-foreground mb-3" />
        <p className="text-muted-foreground mb-4">
          Silakan login untuk menggunakan fitur konsultasi.
        </p>
        <Button asChild>
          <Link to="/login">Login</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in h-[calc(100vh-200px)] flex rounded-xl border overflow-hidden bg-card">
      {/* Sidebar */}
      <div
        className={`${
          showSidebar ? "block" : "hidden"
        } md:block w-full md:w-80 border-r flex-shrink-0`}
      >
        <div className="p-4 border-b">
          <h2 className="font-semibold text-sm text-foreground mb-2">
            Konsultasi
          </h2>
          <Button size="sm" variant="outline" className="w-full" asChild>
            <Link to="/search-doctor">
              <MessageCircle className="h-3.5 w-3.5 mr-1" />
              Cari Dokter Baru
            </Link>
          </Button>
        </div>
        <div className="overflow-y-auto h-[calc(100%-90px)]">
          {rooms.length === 0 && (
            <div className="p-6 text-center text-sm text-muted-foreground">
              <MessageCircle className="h-6 w-6 mx-auto mb-2 text-muted-foreground/50" />
              <p>Belum ada percakapan.</p>
              <p className="mt-1">
                Cari dokter untuk memulai konsultasi.
              </p>
            </div>
          )}
          {rooms.map((room) => (
            <button
              key={room.room_id}
              onClick={() => selectRoom(room)}
              className={`w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors ${
                activeRoom?.room_id === room.room_id
                  ? "bg-primary/5 border-r-2 border-primary"
                  : ""
              }`}
            >
              <div className="h-10 w-10 rounded-full medical-gradient flex items-center justify-center text-primary-foreground text-sm font-bold shrink-0">
                {room.partner_name
                  .split(" ")
                  .filter(
                    (n) =>
                      n.length > 1 && !n.includes(".") && !n.includes(",")
                  )
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm text-foreground block truncate">
                    {room.partner_name}
                  </span>
                  {room.status === "ended" && (
                    <Badge variant="secondary" className="text-[10px] shrink-0 ml-1">Ended</Badge>
                  )}
                </div>
                {room.last_message && (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {room.last_message}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b">
          <button
            className="md:hidden text-muted-foreground"
            onClick={() => setShowSidebar(!showSidebar)}
          >
            ☰
          </button>
          {activeRoom ? (
            <>
              <div className="h-9 w-9 rounded-full medical-gradient flex items-center justify-center text-primary-foreground text-sm font-bold">
                {activeRoom.partner_name
                  .split(" ")
                  .filter(
                    (n) =>
                      n.length > 1 && !n.includes(".") && !n.includes(",")
                  )
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm text-foreground">
                  {activeRoom.partner_name}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  {sessionEnded ? (
                    <><Lock className="h-3 w-3" /> Sesi Berakhir</>
                  ) : (
                    <>
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          isConnected ? "bg-success" : "bg-muted-foreground"
                        }`}
                      />
                      {isConnected ? "Connected" : "Disconnected"}
                    </>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <Lock className="h-3 w-3 text-success" />
                  <span className="text-[10px] text-success font-medium hidden sm:inline">Encrypted</span>
                </div>
                
                {prescriptions.length > 0 && (
                  <Dialog open={isPrescriptionModalOpen} onOpenChange={setIsPrescriptionModalOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-1.5 text-primary border-primary/20 hover:bg-primary/5 animate-pulse-slow">
                        <FileText className="h-4 w-4" />
                        <span className="hidden sm:inline">Resep ({prescriptions.length})</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Resep Obat dari Dokter</DialogTitle>
                        <DialogDescription>
                          Daftar resep yang diberikan selama sesi konsultasi ini.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        {prescriptions.map((pres, idx) => (
                          <div key={pres.id} className="border rounded-xl overflow-hidden bg-card shadow-sm">
                            <div className="bg-primary/5 px-4 py-2 border-b flex justify-between items-center">
                              <span className="text-xs font-bold text-primary uppercase tracking-wider">Resep #{prescriptions.length - idx}</span>
                              <span className="text-[10px] text-muted-foreground">{new Date(pres.created_at).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div className="p-4 space-y-4">
                              <div className="space-y-2">
                                {pres.medications.map((med, midx) => (
                                  <div key={midx} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                      <span className="text-xs font-bold text-primary">{midx + 1}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-bold text-sm text-foreground">{med.name}</p>
                                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                                          <span className="font-semibold text-foreground/70">Dosis:</span> {med.dosage}
                                        </p>
                                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                                          <span className="font-semibold text-foreground/70">Durasi:</span> {med.duration}
                                        </p>
                                      </div>
                                      <p className="text-xs text-primary font-medium mt-1.5 flex items-center gap-1">
                                        <ChevronRight className="h-3 w-3" /> {med.instructions}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              {pres.notes && (
                                <div className="p-3 rounded-lg bg-accent/5 border border-accent/20">
                                  <p className="text-[10px] uppercase font-bold text-accent tracking-widest mb-1">Catatan Dokter</p>
                                  <p className="text-xs text-muted-foreground italic leading-relaxed">"{pres.notes}"</p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </>
          ) : (
            <p className="font-semibold text-sm text-muted-foreground">
              Pilih percakapan atau cari dokter
            </p>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {!activeRoom && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <MessageCircle className="h-12 w-12 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground text-sm">
                Pilih dokter dari daftar di samping atau{" "}
                <Link
                  to="/search-doctor"
                  className="text-primary hover:underline"
                >
                  cari dokter baru
                </Link>
              </p>
            </div>
          )}

          {activeRoom && isLoadingHistory && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 text-primary animate-spin mr-2" />
              <span className="text-sm text-muted-foreground">
                Memuat pesan...
              </span>
            </div>
          )}

          {activeRoom && !isLoadingHistory && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <MessageCircle className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground text-sm">
                Belum ada pesan. Kirim pesan untuk memulai konsultasi.
              </p>
              <p className="text-[10px] text-success mt-2 flex items-center gap-1">
                <Lock className="h-3 w-3" /> Pesan terenkripsi end-to-end
              </p>
            </div>
          )}

          {messages.map((msg, idx) => {
            const isMe = msg.sender_id === userId;
            return (
              <div
                key={idx}
                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                    isMe
                      ? "medical-gradient text-primary-foreground rounded-br-md"
                      : "bg-muted text-foreground rounded-bl-md"
                  }`}
                >
                  <p>{msg.content}</p>
                  <p
                    className={`text-[10px] mt-1 ${
                      isMe
                        ? "text-primary-foreground/60"
                        : "text-muted-foreground"
                    }`}
                  >
                    {formatTime(msg.created_at)}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        {activeRoom && (
          <div className="p-4 border-t">
            {sessionEnded ? (
              <div className="bg-muted/50 rounded-lg p-3 text-center border border-dashed">
                <p className="text-sm text-muted-foreground font-medium">
                  Sesi konsultasi ini telah berakhir.
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Ketik pesan..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  className="flex-1"
                  disabled={!isConnected}
                />
                <Button
                  size="icon"
                  onClick={handleSend}
                  disabled={!message.trim() || !isConnected}
                  className="medical-gradient text-primary-foreground shrink-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            )}
            {!isConnected && !sessionEnded && (
              <p className="text-xs text-destructive mt-1">
                Koneksi terputus. Mencoba menghubungkan ulang...
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
