import { useState } from "react";
import { Search, Filter, MessageSquare } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const history = [
  { id: 1, doctor: "Dr. Sarah Johnson", specialty: "Cardiologist", lastMessage: "Take the medication twice daily.", date: "2026-04-13", messages: 12 },
  { id: 2, doctor: "Dr. Michael Chen", specialty: "Neurologist", lastMessage: "Your test results look normal.", date: "2026-04-10", messages: 8 },
  { id: 3, doctor: "Dr. Emily Davis", specialty: "Dermatologist", lastMessage: "Apply the cream before bed.", date: "2026-04-05", messages: 15 },
  { id: 4, doctor: "Dr. James Wilson", specialty: "Orthopedic", lastMessage: "Continue the exercises daily.", date: "2026-03-28", messages: 6 },
];

export default function ChatHistoryPage() {
  const [search, setSearch] = useState("");
  const filtered = history.filter((h) => h.doctor.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Chat History</h1>
        <p className="text-muted-foreground mt-1">View your past consultations.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by doctor..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select defaultValue="all">
          <SelectTrigger className="w-full sm:w-48"><Filter className="h-4 w-4 mr-2" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Dates</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {filtered.map((chat) => (
          <Card key={chat.id} className="shadow-card hover:shadow-card-hover transition-all duration-300">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-12 w-12 rounded-full medical-gradient flex items-center justify-center text-primary-foreground font-bold shrink-0">
                {chat.doctor.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">{chat.doctor}</h3>
                  <span className="text-xs text-muted-foreground">{chat.date}</span>
                </div>
                <p className="text-sm text-muted-foreground">{chat.specialty}</p>
                <p className="text-sm text-muted-foreground truncate mt-1">{chat.lastMessage}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="text-xs text-muted-foreground">{chat.messages} messages</span>
                <Button size="sm" variant="outline"><MessageSquare className="h-3 w-3 mr-1" />View Chat</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
