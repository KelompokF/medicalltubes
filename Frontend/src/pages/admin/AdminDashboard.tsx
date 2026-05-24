import { Users, Stethoscope, AlertTriangle, MessageSquare, MoreHorizontal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import StatCard from "@/components/StatCard";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { adminService } from "@/services/api";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "react-i18next";

export default function AdminDashboard() {
  const { t } = useTranslation();
  const { data, isLoading, error } = useQuery({
    queryKey: ["adminDashboard"],
    queryFn: async () => {
      const response = await adminService.getDashboard();
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <Skeleton className="h-80 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">{t("admin.dashboard.failedToLoad")}</div>;
  }

  const { stats, recentUsers = [], analyticsData = [] } = data || {};

  const adminStats = stats || {
    totalUsers: 0,
    totalDoctors: 0,
    activeEmergencies: 0,
    totalConsultations: 0,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-foreground">{t("admin.dashboard.title")}</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title={t("admin.dashboard.totalUsers")} value={adminStats.totalUsers.toLocaleString()} icon={Users} variant="primary" />
        <StatCard title={t("admin.dashboard.totalDoctors")} value={adminStats.totalDoctors} icon={Stethoscope} variant="success" />
        <StatCard title={t("admin.dashboard.activeEmergencies")} value={adminStats.activeEmergencies} icon={AlertTriangle} variant="emergency" />
        <StatCard title={t("admin.dashboard.totalConsultations")} value={adminStats.totalConsultations.toLocaleString()} icon={MessageSquare} variant="warning" />
      </div>

      {/* Charts */}
      <Card className="shadow-card">
        <CardHeader><CardTitle>{t("admin.dashboard.analyticsOverview")}</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analyticsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
              <Legend />
              <Bar dataKey="consultations" fill="hsl(213 94% 48%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="homeVisits" fill="hsl(152 69% 40%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="emergencies" fill="hsl(0 84% 55%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* User Table */}
      <Card className="shadow-card">
        <CardHeader><CardTitle>{t("admin.dashboard.recentUsers")}</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("admin.dashboard.name")}</TableHead>
                <TableHead>{t("admin.dashboard.email")}</TableHead>
                <TableHead>{t("admin.dashboard.role")}</TableHead>
                <TableHead>{t("admin.dashboard.status")}</TableHead>
                <TableHead>{t("admin.dashboard.joined")}</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentUsers.map((user: any) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell><Badge variant="outline" className="capitalize">{user.role}</Badge></TableCell>
                  <TableCell>
                    <Badge className={user.status === "Active" ? "bg-success/10 text-success border-success/20" : "bg-muted text-muted-foreground"}>
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{user.joined}</TableCell>
                  <TableCell><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
