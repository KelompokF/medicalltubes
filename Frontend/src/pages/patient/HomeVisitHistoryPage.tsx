import { useState } from "react";
import { Link } from "react-router-dom";
import { Home, Calendar, Clock, MapPin, Search, Filter, Eye, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import EmptyState from "@/components/EmptyState";

const homeVisitHistory = [
  { id: "hv-1", doctor: "Dr. Sarah Johnson", specialization: "Cardiologist", date: "2026-04-10", time: "10:00 AM", address: "123 Main St, New York, NY", status: "completed" as const, notes: "Routine heart checkup at home" },
  { id: "hv-2", doctor: "Dr. Emily Davis", specialization: "Dermatologist", date: "2026-04-08", time: "02:00 PM", address: "456 Oak Ave, Chicago, IL", status: "completed" as const, notes: "Skin allergy follow-up" },
  { id: "hv-3", doctor: "Dr. Michael Chen", specialization: "Neurologist", date: "2026-04-15", time: "11:00 AM", address: "789 Pine Rd, Los Angeles, CA", status: "confirmed" as const, notes: "Migraine treatment session" },
  { id: "hv-4", doctor: "Dr. James Wilson", specialization: "Orthopedic Surgeon", date: "2026-04-16", time: "09:30 AM", address: "321 Elm St, Houston, TX", status: "pending" as const, notes: "Post-surgery knee evaluation" },
  { id: "hv-5", doctor: "Dr. Lisa Park", specialization: "Pediatrician", date: "2026-03-28", time: "03:00 PM", address: "654 Maple Dr, Phoenix, AZ", status: "cancelled" as const, notes: "Child vaccination visit" },
  { id: "hv-6", doctor: "Dr. Robert Martinez", specialization: "General Practitioner", date: "2026-03-20", time: "10:30 AM", address: "987 Cedar Ln, San Diego, CA", status: "completed" as const, notes: "General health checkup" },
];

const statusConfig = {
  completed: { label: "Completed", color: "bg-success/10 text-success border-success/20", icon: CheckCircle },
  confirmed: { label: "Confirmed", color: "bg-primary/10 text-primary border-primary/20", icon: Clock },
  pending: { label: "Pending", color: "bg-warning/10 text-warning border-warning/20", icon: Loader2 },
  cancelled: { label: "Cancelled", color: "bg-destructive/10 text-destructive border-destructive/20", icon: XCircle },
};

export default function HomeVisitHistoryPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = homeVisitHistory.filter((visit) => {
    const matchesSearch = visit.doctor.toLowerCase().includes(search.toLowerCase()) || visit.address.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || visit.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Home Visit History</h1>
        <p className="text-muted-foreground mt-1">View and track all your home visit bookings.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by doctor or address..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Visits", value: homeVisitHistory.length, color: "bg-primary/10 text-primary" },
          { label: "Completed", value: homeVisitHistory.filter(v => v.status === "completed").length, color: "bg-success/10 text-success" },
          { label: "Upcoming", value: homeVisitHistory.filter(v => v.status === "confirmed" || v.status === "pending").length, color: "bg-warning/10 text-warning" },
          { label: "Cancelled", value: homeVisitHistory.filter(v => v.status === "cancelled").length, color: "bg-destructive/10 text-destructive" },
        ].map((stat) => (
          <div key={stat.label} className={`rounded-xl p-4 ${stat.color}`}>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-xs font-medium opacity-80">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Visit List */}
      {filtered.length === 0 ? (
        <EmptyState title="No visits found" description="Try adjusting your search or filter." icon={<Home className="h-8 w-8 text-muted-foreground" />} />
      ) : (
        <div className="space-y-3">
          {filtered.map((visit) => {
            const config = statusConfig[visit.status];
            const StatusIcon = config.icon;
            return (
              <Card key={visit.id} className="shadow-card hover:shadow-md transition-shadow">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="hidden sm:flex h-12 w-12 rounded-full medical-gradient items-center justify-center text-primary-foreground font-bold text-sm shrink-0">
                        {visit.doctor.split(" ").slice(1).map(n => n[0]).join("")}
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-foreground">{visit.doctor}</h3>
                          <Badge variant="outline" className={config.color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {config.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{visit.specialization}</p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{visit.date}</span>
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{visit.time}</span>
                          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{visit.address}</span>
                        </div>
                        {visit.notes && <p className="text-xs text-muted-foreground/70 italic">"{visit.notes}"</p>}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {(visit.status === "confirmed" || visit.status === "pending") && (
                        <Button variant="outline" size="sm" asChild>
                          <Link to="/tracking">Track Visit</Link>
                        </Button>
                      )}
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4 mr-1" /> Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
