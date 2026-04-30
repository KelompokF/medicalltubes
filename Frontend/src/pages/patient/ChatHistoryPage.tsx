import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search, Filter, MessageSquare, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import EmptyState from "@/components/EmptyState";
import api from "@/services/api";

interface ChatHistoryItem {
  room_id: string;
  partner_id: string;
  partner_name: string;
  partner_role: string;
  last_message: string;
  last_date: string | null;
  message_count: number;
}

export default function ChatHistoryPage() {
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("all");

  const { data: history = [], isLoading, isError } = useQuery<ChatHistoryItem[]>({
    queryKey: ["chatHistory"],
    queryFn: async () => {
      const res = await api.get("/chat/rooms");
      return res.data;
    },
  });

  const filtered = history.filter((h) => {
    const matchesSearch = h.partner_name.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;

    if (dateFilter === "all") return true;

    if (!h.last_date) return false;
    const msgDate = new Date(h.last_date);
    const now = new Date();

    if (dateFilter === "week") {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return msgDate >= weekAgo;
    }
    if (dateFilter === "month") {
      const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      return msgDate >= monthAgo;
    }
    return true;
  });

  if (isLoading && !isError) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Chat History</h1>
        <p className="text-muted-foreground mt-1">View your past consultations.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="w-full sm:w-48"><Filter className="h-4 w-4 mr-2" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Dates</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No chat history"
          description={history.length === 0 ? "You haven't had any conversations yet. Start a consultation to begin chatting." : "No conversations match your search."}
          icon={<MessageSquare className="h-8 w-8 text-muted-foreground" />}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((chat) => (
            <Card key={chat.partner_id} className="shadow-card hover:shadow-card-hover transition-all duration-300">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="h-12 w-12 rounded-full medical-gradient flex items-center justify-center text-primary-foreground font-bold shrink-0">
                  {chat.partner_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground">{chat.partner_name}</h3>
                    <span className="text-xs text-muted-foreground">
                      {chat.last_date ? new Date(chat.last_date).toLocaleDateString() : "-"}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground capitalize">{chat.partner_role}</p>
                  <p className="text-sm text-muted-foreground truncate mt-1">{chat.last_message}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="text-xs text-muted-foreground">{chat.message_count} messages</span>
                  <Button size="sm" variant="outline" asChild>
                    <Link to={`/chat?room_id=${chat.room_id}`}>
                      <MessageSquare className="h-3 w-3 mr-1" />
                      View Chat
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
