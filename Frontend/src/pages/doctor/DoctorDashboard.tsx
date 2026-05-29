import { Users, Clock, Home, Bell, Calendar, Pill } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import StatCard from "@/components/StatCard";
import { useTranslation } from "react-i18next";

export default function DoctorDashboard() {
  const { t } = useTranslation();
  const doctorDashboardStats = {
    patientsToday: 0,
    pendingConsultations: 0,
    upcomingHomeVisits: 0,
    newNotifications: 0,
  };
  const patientRequests: any[] = [];
  const doctorSchedule: any[] = [];

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-foreground">{t("doctor.dashboard.title")}</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title={t("doctor.dashboard.patientsToday")} value={doctorDashboardStats.patientsToday} icon={Users} variant="primary" />
        <StatCard title={t("doctor.dashboard.pendingConsultations")} value={doctorDashboardStats.pendingConsultations} icon={Clock} variant="warning" />
        <StatCard title={t("doctor.dashboard.upcomingHomeVisits")} value={doctorDashboardStats.upcomingHomeVisits} icon={Home} variant="success" />
        <StatCard title={t("doctor.dashboard.newNotifications")} value={doctorDashboardStats.newNotifications} icon={Bell} variant="primary" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient Requests */}
        <Card className="shadow-card lg:col-span-2">
          <CardHeader><CardTitle>{t("doctor.dashboard.patientRequests")}</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("doctor.dashboard.patient")}</TableHead>
                  <TableHead>{t("doctor.dashboard.type")}</TableHead>
                  <TableHead>{t("doctor.dashboard.time")}</TableHead>
                  <TableHead>{t("doctor.dashboard.status")}</TableHead>
                  <TableHead>{t("doctor.dashboard.action")}</TableHead>
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
                    <TableCell><Button size="sm" variant="outline">{t("doctor.dashboard.accept")}</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Schedule */}
        <Card className="shadow-card">
          <CardHeader><CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5 text-primary" />{t("doctor.dashboard.todaysSchedule")}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {doctorSchedule && doctorSchedule.length > 0 ? (
              doctorSchedule[0].slots.map((slot, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">{slot}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">{i < 2 ? t("doctor.dashboard.booked") : t("doctor.dashboard.free")}</Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">{t("doctor.dashboard.noSchedule")}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Prescription Card */}
      <Card className="shadow-card">
        <CardHeader><CardTitle className="flex items-center gap-2"><Pill className="h-5 w-5 text-primary" />{t("doctor.dashboard.recentPrescriptions")}</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {["John Smith - Amoxicillin 500mg", "Jane Doe - Ibuprofen 200mg", "Mike Brown - Metformin 850mg"].map((rx, i) => (
              <div key={i} className="p-4 rounded-lg border bg-card hover:shadow-card-hover transition-all">
                <p className="text-sm font-medium text-foreground">{rx}</p>
                <p className="text-xs text-muted-foreground mt-1">{t("doctor.dashboard.prescribed")}: April {10 + i}, 2026</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
