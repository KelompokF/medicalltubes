import { Users, Clock, Home, Bell, Calendar, Pill } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import StatCard from "@/components/StatCard";
import { doctorDashboardStats, patientRequests, doctorSchedule } from "@/data/mockData";

export default function DoctorDashboard() {
  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-foreground">Doctor Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Patients Today" value={doctorDashboardStats.patientsToday} icon={Users} variant="primary" />
        <StatCard title="Pending Consultations" value={doctorDashboardStats.pendingConsultations} icon={Clock} variant="warning" />
        <StatCard title="Upcoming Home Visits" value={doctorDashboardStats.upcomingHomeVisits} icon={Home} variant="success" />
        <StatCard title="New Notifications" value={doctorDashboardStats.newNotifications} icon={Bell} variant="primary" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient Requests */}
        <Card className="shadow-card lg:col-span-2">
          <CardHeader><CardTitle>Patient Requests</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patientRequests.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell className="font-medium">{req.patient}</TableCell>
                    <TableCell>{req.type}</TableCell>
                    <TableCell className="text-muted-foreground">{req.time}</TableCell>
                    <TableCell>
                      <Badge className={req.status === "Confirmed" ? "bg-success/10 text-success border-success/20" : "bg-warning/10 text-warning border-warning/20"}>
                        {req.status}
                      </Badge>
                    </TableCell>
                    <TableCell><Button size="sm" variant="outline">Accept</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Schedule */}
        <Card className="shadow-card">
          <CardHeader><CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5 text-primary" />Today's Schedule</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {doctorSchedule[0].slots.map((slot, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">{slot}</span>
                </div>
                <Badge variant="outline" className="text-xs">{i < 2 ? "Booked" : "Free"}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Prescription Card */}
      <Card className="shadow-card">
        <CardHeader><CardTitle className="flex items-center gap-2"><Pill className="h-5 w-5 text-primary" />Recent Prescriptions</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {["John Smith - Amoxicillin 500mg", "Jane Doe - Ibuprofen 200mg", "Mike Brown - Metformin 850mg"].map((rx, i) => (
              <div key={i} className="p-4 rounded-lg border bg-card hover:shadow-card-hover transition-all">
                <p className="text-sm font-medium text-foreground">{rx}</p>
                <p className="text-xs text-muted-foreground mt-1">Prescribed: April {10 + i}, 2026</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
