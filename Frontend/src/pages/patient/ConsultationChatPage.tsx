import { useEffect, useRef, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Send, ArrowLeft, Loader2, MessageCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import api from "@/services/api";

interface ChatMessage {
  id: string | number;
  sender: "user" | "doctor";
  message: string;
  timestamp: string;
}

interface Conversation {
  doctorId: string;
  doctorName: string;
}

export default function ConsultationChatPage() {
  const [searchParams] = useSearchParams();
  const doctorIdFromUrl = searchParams.get("doctor_id");
  const doctorNameFromUrl = searchParams.get("doctor_name");

  // Current user info
  const user =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user") || "null")
      : null;
  const userId = user?.id || user?.sub || null;

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

  // Load conversation list (unique partners from messages)
  useEffect(() => {
    const loadConversations = async () => {
      if (!userId) return;
      try {
        // Fetch all conversations for this user from chat history
        const response = await api.get("/chat/history");
        const data = response.data;
        if (Array.isArray(data)) {
          const convs: Conversation[] = data.map((c: any) => ({
            doctorId: c.partner_id,
            doctorName: c.partner_name || `User ${c.partner_id.slice(0, 8)}`,
          }));
          setConversations(convs);
        }
      } catch {
        // Fallback: start with empty or URL-based conversation
      }

      // If coming from search page with doctor_id, set as active
      if (doctorIdFromUrl) {
        const conv: Conversation = {
          doctorId: doctorIdFromUrl,
          doctorName: doctorNameFromUrl || "Dokter",
        };
        setActiveConversation(conv);
        // Add to conversations if not already there
        setConversations((prev) => {
          const exists = prev.find((c) => c.doctorId === doctorIdFromUrl);
          if (!exists) return [conv, ...prev];
          return prev;
        });
      }
    };
    loadConversations();
  }, [userId, doctorIdFromUrl, doctorNameFromUrl]);

  // Load message history when active conversation changes
  useEffect(() => {
    const loadMessages = async () => {
      if (!userId || !activeConversation) return;
      setIsLoadingHistory(true);
      try {
        const response = await api.get(
          `/chat/messages/${userId}/${activeConversation.doctorId}`
        );
        const data = response.data;
        if (Array.isArray(data)) {
          const msgs: ChatMessage[] = data.map((m: any, idx: number) => ({
            id: m.id || idx,
            sender: m.sender_id === userId ? "user" : "doctor",
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
  }, [userId, activeConversation]);

  // WebSocket connection
  useEffect(() => {
    if (!userId) return;

    const port = window.location.hostname === "localhost" ? "8001" : window.location.port;
    const wsUrl = `${location.protocol === "https:" ? "wss" : "ws"}://${window.location.hostname}:${port}/ws/chat/${userId}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket connected", wsUrl);
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const isSenderUser = data.sender_id === userId;
        // Only add if for current conversation
        if (
          activeConversation &&
          (data.sender_id === activeConversation.doctorId ||
            data.receiver_id === activeConversation.doctorId)
        ) {
          const newMsg: ChatMessage = {
            id: Date.now(),
            sender: isSenderUser ? "user" : "doctor",
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
  }, [userId, activeConversation?.doctorId]);

  const handleSend = () => {
    if (!message.trim() || !activeConversation) return;

    // Optimistic UI
    const localMsg: ChatMessage = {
      id: Date.now(),
      sender: "user",
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
          receiver_id: activeConversation.doctorId,
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
        className={`${showSidebar ? "block" : "hidden"
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
          {conversations.length === 0 && (
            <div className="p-6 text-center text-sm text-muted-foreground">
              <MessageCircle className="h-6 w-6 mx-auto mb-2 text-muted-foreground/50" />
              <p>Belum ada percakapan.</p>
              <p className="mt-1">
                Cari dokter untuk memulai konsultasi.
              </p>
            </div>
          )}
          {conversations.map((conv) => (
            <button
              key={conv.doctorId}
              onClick={() => selectConversation(conv)}
              className={`w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors ${activeConversation?.doctorId === conv.doctorId
                  ? "bg-primary/5 border-r-2 border-primary"
                  : ""
                }`}
            >
              <div className="h-10 w-10 rounded-full medical-gradient flex items-center justify-center text-primary-foreground text-sm font-bold shrink-0">
                {conv.doctorName
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
                <span className="font-medium text-sm text-foreground block truncate">
                  {conv.doctorName}
                </span>
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
          {activeConversation ? (
            <>
              <div className="h-9 w-9 rounded-full medical-gradient flex items-center justify-center text-primary-foreground text-sm font-bold">
                {activeConversation.doctorName
                  .split(" ")
                  .filter(
                    (n) =>
                      n.length > 1 && !n.includes(".") && !n.includes(",")
                  )
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)}
              </div>
              <div>
                <p className="font-semibold text-sm text-foreground">
                  {activeConversation.doctorName}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${isConnected ? "bg-success" : "bg-muted-foreground"
                      }`}
                  />
                  {isConnected ? "Connected" : "Disconnected"}
                </p>
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
          {!activeConversation && (
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

          {activeConversation && isLoadingHistory && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 text-primary animate-spin mr-2" />
              <span className="text-sm text-muted-foreground">
                Memuat pesan...
              </span>
            </div>
          )}

          {activeConversation && !isLoadingHistory && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <MessageCircle className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground text-sm">
                Belum ada pesan. Kirim pesan untuk memulai konsultasi.
              </p>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"
                }`}
            >
              <div
                className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${msg.sender === "user"
                    ? "medical-gradient text-primary-foreground rounded-br-md"
                    : "bg-muted text-foreground rounded-bl-md"
                  }`}
              >
                <p>{msg.message}</p>
                <p
                  className={`text-[10px] mt-1 ${msg.sender === "user"
                      ? "text-primary-foreground/60"
                      : "text-muted-foreground"
                    }`}
                >
                  {msg.timestamp}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        {activeConversation && (
          <div className="p-4 border-t">
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
            {!isConnected && (
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
