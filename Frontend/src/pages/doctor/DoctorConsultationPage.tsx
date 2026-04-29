import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Send, Loader2, MessageCircle, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import api from "@/services/api";

interface ChatMessage {
  id: string | number;
  sender: "user" | "doctor"; // 'user' means the patient, 'doctor' means current user
  message: string;
  timestamp: string;
}

interface Conversation {
  patientId: string;
  patientName: string;
  lastMessage?: string;
  lastDate?: string;
}

export default function DoctorConsultationPage() {
  // Current doctor info
  const user =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user") || "null")
      : null;
  const doctorId = user?.id || user?.sub || null;

  // State
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] =
    useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState("");
  const [showSidebar, setShowSidebar] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load conversation list (patients that have messaged the doctor)
  useEffect(() => {
    const loadConversations = async () => {
      if (!doctorId) return;
      try {
        // Fetch all conversations for this doctor
        const response = await api.get("/chat/history");

        const data = response.data;
        if (Array.isArray(data)) {
          const convs: Conversation[] = data.map((c: any) => ({
            patientId: c.partner_id,
            patientName: c.partner_name || `Patient ${c.partner_id.slice(0, 8)}`,
            lastMessage: c.last_message,
            lastDate: c.last_date,
          }));
          setConversations(convs);
        }
      } catch (err) {
        console.error("Failed to load conversations:", err);
      }
    };
    loadConversations();
  }, [doctorId]);

  // Load message history when active conversation changes
  useEffect(() => {
    const loadMessages = async () => {
      if (!doctorId || !activeConversation) return;
      setIsLoadingHistory(true);
      try {
        const response = await api.get(
          `/chat/messages/${doctorId}/${activeConversation.patientId}`
        );
        const data = response.data;
        if (Array.isArray(data)) {
          const msgs: ChatMessage[] = data.map((m: any, idx: number) => ({
            id: m.id || idx,
            sender: m.sender_id === doctorId ? "doctor" : "user", // For doctor, if sender is me, it's 'doctor'
            message: m.content,
            timestamp: new Date(m.created_at).toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
            }),
          }));
          setMessages(msgs);
        }
      } catch {
        setMessages([]);
      } finally {
        setIsLoadingHistory(false);
      }
    };
    loadMessages();
  }, [doctorId, activeConversation]);

  // WebSocket connection
  useEffect(() => {
    if (!doctorId) return;

    const port = window.location.hostname === "localhost" ? "8001" : window.location.port;
    const wsUrl = `${location.protocol === "https:" ? "wss" : "ws"}://${window.location.hostname}:${port}/ws/chat/${doctorId}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket connected", wsUrl);
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const isSenderDoctor = data.sender_id === doctorId;

        // If it's a new conversation from a new patient, we might need to reload conversations
        // For now, just add message if it's for the active conversation
        if (
          activeConversation &&
          (data.sender_id === activeConversation.patientId ||
            data.receiver_id === activeConversation.patientId)
        ) {
          const newMsg: ChatMessage = {
            id: Date.now(),
            sender: isSenderDoctor ? "doctor" : "user",
            message: data.content,
            timestamp: data.created_at
              ? new Date(data.created_at).toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
              })
              : new Date().toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
              }),
          };
          setMessages((prev) => [...prev, newMsg]);
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
  }, [doctorId, activeConversation?.patientId]);

  const handleSend = () => {
    if (!message.trim() || !activeConversation) return;

    // Optimistic UI
    const localMsg: ChatMessage = {
      id: Date.now(),
      sender: "doctor",
      message: message,
      timestamp: new Date().toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    // Send via WebSocket
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          receiver_id: activeConversation.patientId,
          content: message,
        })
      );
      // Don't add optimistic message since WS echo will add it
    } else {
      // Fallback: add optimistic and warn
      setMessages((prev) => [...prev, localMsg]);
      console.warn("WebSocket not connected, message not sent to server");
    }

    setMessage("");
  };

  const selectConversation = (conv: Conversation) => {
    setActiveConversation(conv);
    setShowSidebar(false);
  };

  // No user logged in
  if (!doctorId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
        <MessageCircle className="h-8 w-8 text-muted-foreground mb-3" />
        <p className="text-muted-foreground mb-4">
          Silakan login untuk melihat daftar konsultasi.
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in h-[calc(100vh-140px)] flex rounded-xl shadow-card overflow-hidden bg-card border border-border/50">
      {/* Sidebar */}
      <div
        className={`${showSidebar ? "block" : "hidden"
          } md:block w-full md:w-80 border-r border-border/50 flex-shrink-0 bg-muted/10`}
      >
        <div className="p-4 border-b border-border/50 bg-card">
          <h2 className="font-semibold text-lg text-foreground mb-1">
            Daftar Pasien
          </h2>
          <p className="text-xs text-muted-foreground">Pesan konsultasi yang masuk</p>
        </div>
        <div className="overflow-y-auto h-[calc(100%-70px)]">
          {conversations.length === 0 && (
            <div className="p-8 text-center text-sm text-muted-foreground flex flex-col items-center">
              <div className="bg-primary/10 p-3 rounded-full mb-3">
                <User className="h-6 w-6 text-primary" />
              </div>
              <p className="font-medium text-foreground mb-1">Belum ada pesan masuk.</p>
              <p className="text-xs">Pasien yang menghubungi Anda akan muncul di sini.</p>
            </div>
          )}
          {conversations.map((conv) => (
            <button
              key={conv.patientId}
              onClick={() => selectConversation(conv)}
              className={`w-full flex items-center gap-3 p-4 transition-colors border-b border-border/50 last:border-0 ${activeConversation?.patientId === conv.patientId
                  ? "bg-primary/10 border-l-4 border-l-primary"
                  : "hover:bg-muted/50 border-l-4 border-l-transparent"
                }`}
            >
              <div className="h-10 w-10 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-sm font-bold shrink-0">
                {conv.patientName
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
                    {conv.patientName}
                  </span>
                  {conv.lastDate && (
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {new Date(conv.lastDate).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  )}
                </div>
                {conv.lastMessage && (
                  <p className="text-xs text-muted-foreground truncate">{conv.lastMessage}</p>
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
          {activeConversation ? (
            <div className="flex items-center gap-3 w-full">
              <div className="h-10 w-10 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-sm font-bold shrink-0 shadow-sm">
                {activeConversation.patientName
                  .split(" ")
                  .filter((n) => n.length > 0)
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-sm text-foreground">
                  {activeConversation.patientName}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className={`relative flex h-2 w-2`}
                  >
                    {isConnected && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>}
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${isConnected ? "bg-success" : "bg-muted-foreground"}`}></span>
                  </span>
                  <span className="text-[10px] uppercase font-medium tracking-wider text-muted-foreground">
                    {isConnected ? "Connected" : "Disconnected"}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <p className="font-semibold text-sm text-muted-foreground">
              Pilih pasien untuk melihat percakapan
            </p>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {!activeConversation && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <MessageCircle className="h-16 w-16 text-muted/50 mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-1">Ruang Konsultasi Dokter</h3>
              <p className="text-muted-foreground text-sm max-w-sm">
                Pilih pasien dari daftar di sebelah kiri untuk mulai membalas pesan mereka.
              </p>
            </div>
          )}

          {activeConversation && isLoadingHistory && (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                <span className="text-sm font-medium text-muted-foreground">
                  Memuat percakapan...
                </span>
              </div>
            </div>
          )}

          {activeConversation && !isLoadingHistory && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Badge variant="outline" className="mb-4 bg-muted/50 text-muted-foreground border-border">Percakapan Baru</Badge>
              <p className="text-muted-foreground text-sm">
                Sapa pasien Anda untuk memulai sesi konsultasi.
              </p>
            </div>
          )}

          {messages.map((msg) => {
            const isDoctor = msg.sender === "doctor";
            return (
              <div
                key={msg.id}
                className={`flex ${isDoctor ? "justify-end" : "justify-start"
                  }`}
              >
                <div
                  className={`max-w-[75%] px-4 py-3 text-sm shadow-sm ${isDoctor
                      ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm"
                      : "bg-card border border-border/50 text-foreground rounded-2xl rounded-tl-sm"
                    }`}
                >
                  <p className="leading-relaxed">{msg.message}</p>
                  <div
                    className={`flex items-center justify-end gap-1 mt-1.5 ${isDoctor
                        ? "text-primary-foreground/70"
                        : "text-muted-foreground/70"
                      }`}
                  >
                    <span className="text-[10px] font-medium">{msg.timestamp}</span>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        {activeConversation && (
          <div className="p-4 bg-card border-t border-border/50">
            <div className="flex items-center gap-3 bg-muted/30 rounded-full border border-border/50 p-1 pl-4 focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-all shadow-inner">
              <Input
                placeholder="Balas pasien..."
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
            {!isConnected && (
              <p className="text-[10px] font-medium text-warning flex items-center justify-center gap-1 mt-2">
                <span className="relative flex h-1.5 w-1.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-warning opacity-75"></span><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-warning"></span></span>
                Koneksi terputus. Mencoba menghubungkan ulang...
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
