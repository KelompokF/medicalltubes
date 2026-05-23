import { AlertTriangle, MapPin, Clock, CheckCircle, Truck, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

const priorityColors = {
  Critical: "bg-emergency/10 text-emergency border-emergency/20",
  High: "bg-warning/10 text-warning border-warning/20",
  Medium: "bg-primary/10 text-primary border-primary/20",
};

export default function AmbulanceDashboard() {
  const { t } = useTranslation();
  const emergencyRequests: any[] = [];
  
  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-foreground">{t("ambulance.dashboard.title")}</h1>

      {/* Incoming Requests */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {emergencyRequests.map((req) => (
          <Card key={req.id} className={`shadow-card hover:shadow-card-hover transition-all border-l-4 ${req.priority === "Critical" ? "border-l-emergency" : req.priority === "High" ? "border-l-warning" : "border-l-primary"}`}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <Badge className={priorityColors[req.priority as keyof typeof priorityColors]}>{req.priority}</Badge>
                <span className="text-xs text-muted-foreground">{req.time}</span>
              </div>
              <h3 className="font-semibold text-foreground">{req.patient}</h3>
              <p className="text-sm text-muted-foreground mt-1">{req.type}</p>
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-2">
                <MapPin className="h-3.5 w-3.5" />{req.location}
              </div>
              <div className="flex gap-2 mt-4">
                <Button size="sm" className="flex-1" onClick={() => toast.success("En route!")}>
                  <Truck className="h-3.5 w-3.5 mr-1" />{t("ambulance.dashboard.onRoute")}
                </Button>
                <Button size="sm" variant="outline" className="flex-1" onClick={() => toast.success("Arrived!")}>
                  <CheckCircle className="h-3.5 w-3.5 mr-1" />{t("ambulance.dashboard.arrived")}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Status Buttons */}
      <Card className="shadow-card">
        <CardHeader><CardTitle>{t("ambulance.dashboard.quickStatusUpdate")}</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button onClick={() => toast.info("Status: On Route")} className="medical-gradient text-primary-foreground"><Truck className="h-4 w-4 mr-2" />{t("ambulance.dashboard.onRoute")}</Button>
          <Button onClick={() => toast.info("Status: Arrived")} variant="outline"><CheckCircle className="h-4 w-4 mr-2" />{t("ambulance.dashboard.arrived")}</Button>
          <Button onClick={() => toast.success("Status: Completed")} variant="outline" className="text-success border-success/20"><CheckCircle className="h-4 w-4 mr-2" />{t("ambulance.dashboard.completed")}</Button>
        </CardContent>
      </Card>

      {/* History */}
      <Card className="shadow-card">
        <CardHeader><CardTitle>{t("ambulance.dashboard.emergencyHistory")}</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("ambulance.dashboard.patient")}</TableHead>
                <TableHead>{t("ambulance.dashboard.type")}</TableHead>
                <TableHead>{t("ambulance.dashboard.location")}</TableHead>
                <TableHead>{t("ambulance.dashboard.priority")}</TableHead>
                <TableHead>{t("ambulance.dashboard.status")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  {t("ambulance.dashboard.noHistory")}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
