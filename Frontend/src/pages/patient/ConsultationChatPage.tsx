import { useEffect, useRef, useState } from "react";
import { Send, Paperclip, Smile, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function ConsultationChatPage() {
  const chatConversations: any[] = [];
  const chatMessages: any[] = [];
  
  const [activeChat, setActiveChat] = useState<number>(0);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<any[]>(chatMessages);
  const [showSidebar, setShowSidebar] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  // get current user id from localStorage (set at login)
  const user = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "null") : null;
  const userId = user?.id || user?.sub || null;

  useEffect(() => {
    if (!userId) return;

    const wsUrl = `${location.protocol === "https:" ? "wss" : "ws"}://${location.hostname}:8000/ws/chat/${userId}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket connected", wsUrl);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        // data expected: { sender_id, receiver_id, content, created_at }
        const isSenderUser = data.sender_id === userId;
        const newMsg = {
          id: messages.length + 1,
          sender: isSenderUser ? "user" : "doctor",
          message: data.content,
          timestamp: data.created_at || new Date().toLocaleTimeString(),
        };
        setMessages((prev) => [...prev, newMsg]);
      } catch (e) {
        console.error("Invalid WS message", e);
      }
    };

    ws.onclose = () => console.log("WebSocket closed");
    ws.onerror = (e) => console.error("WebSocket error", e);

    return () => {
      ws.close();
      wsRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const handleSend = () => {
    if (!message.trim()) return;
    const active = chatConversations[activeChat];
    const receiverId = active?.id || "";

    // Optimistic UI add
    const localMsg = { id: messages.length + 1, sender: "user", message, timestamp: new Date().toLocaleTimeString() };
    setMessages((prev) => [...prev, localMsg]);

    // send via websocket if connected
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ receiver_id: receiverId, content: message }));
    } else {
      console.warn("WebSocket not connected, message not sent to server");
    }

    setMessage("");
  };

  const active = chatConversations[activeChat] || null;

  return (
    <div className="animate-fade-in h-[calc(100vh-200px)] flex rounded-xl border overflow-hidden bg-card">
      {/* Sidebar */}
      <div className={`${showSidebar ? "block" : "hidden"} md:block w-full md:w-80 border-r flex-shrink-0`}>
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search conversations..." className="pl-10" />
          </div>
        </div>
        <div className="overflow-y-auto h-[calc(100%-65px)]">
          {chatConversations.map((conv, i) => (
            <button
              key={conv.id}
              onClick={() => { setActiveChat(i); setShowSidebar(false); }}
              className={`w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors ${i === activeChat ? "bg-primary/5 border-r-2 border-primary" : ""}`}
            >
              <div className="h-10 w-10 rounded-full medical-gradient flex items-center justify-center text-primary-foreground text-sm font-bold shrink-0">
                {conv.doctorName.split(" ").slice(1).map((n) => n[0]).join("")}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm text-foreground">{conv.doctorName}</span>
                  <span className="text-xs text-muted-foreground">{conv.timestamp}</span>
                </div>
                <p className="text-xs text-muted-foreground truncate">{conv.lastMessage}</p>
              </div>
              {conv.unread > 0 && <Badge className="bg-primary text-primary-foreground h-5 w-5 flex items-center justify-center rounded-full p-0 text-[10px]">{conv.unread}</Badge>}
            </button>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b">
          <button className="md:hidden text-muted-foreground" onClick={() => setShowSidebar(!showSidebar)}>☰</button>
          <div className="h-9 w-9 rounded-full medical-gradient flex items-center justify-center text-primary-foreground text-sm font-bold">{active?.doctorName ? active.doctorName.split(" ").map((n:string)=>n[0]).slice(0,2).join("") : "U"}</div>
          <div>
            <p className="font-semibold text-sm text-foreground">{active?.doctorName || "No conversation selected"}</p>
            <p className="text-xs text-muted-foreground">{active ? "Online" : ""}</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                msg.sender === "user"
                  ? "medical-gradient text-primary-foreground rounded-br-md"
                  : "bg-muted text-foreground rounded-bl-md"
              }`}>
                <p>{msg.message}</p>
                <p className={`text-[10px] mt-1 ${msg.sender === "user" ? "text-primary-foreground/60" : "text-muted-foreground"}`}>{msg.timestamp}</p>
              </div>
            </div>
          ))}
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="flex gap-1"><div className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" /><div className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:0.1s]" /><div className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:0.2s]" /></div>
            <span className="text-xs">Dr. Johnson is typing...</span>
          </div>
        </div>

        {/* Input */}
        <div className="p-4 border-t">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground"><Paperclip className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground"><Smile className="h-4 w-4" /></Button>
            <Input placeholder="Type a message..." value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSend()} className="flex-1" />
            <Button size="icon" onClick={handleSend} className="medical-gradient text-primary-foreground shrink-0"><Send className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>
    </div>
  );
}
