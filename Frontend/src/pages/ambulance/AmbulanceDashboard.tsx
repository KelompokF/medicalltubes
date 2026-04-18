import { AlertTriangle, MapPin, Clock, CheckCircle, Truck, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { emergencyRequests } from "@/data/mockData";
import { toast } from "sonner";

const priorityColors = {
  Critical: "bg-emergency/10 text-emergency border-emergency/20",
  High: "bg-warning/10 text-warning border-warning/20",
  Medium: "bg-primary/10 text-primary border-primary/20",
};

export default function AmbulanceDashboard() {
  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-foreground">Ambulance Service Dashboard</h1>

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
                  <Truck className="h-3.5 w-3.5 mr-1" />On Route
                </Button>
                <Button size="sm" variant="outline" className="flex-1" onClick={() => toast.success("Arrived!")}>
                  <CheckCircle className="h-3.5 w-3.5 mr-1" />Arrived
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Status Buttons */}
      <Card className="shadow-card">
        <CardHeader><CardTitle>Quick Status Update</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button onClick={() => toast.info("Status: On Route")} className="medical-gradient text-primary-foreground"><Truck className="h-4 w-4 mr-2" />On Route</Button>
          <Button onClick={() => toast.info("Status: Arrived")} variant="outline"><CheckCircle className="h-4 w-4 mr-2" />Arrived</Button>
          <Button onClick={() => toast.success("Status: Completed")} variant="outline" className="text-success border-success/20"><CheckCircle className="h-4 w-4 mr-2" />Completed</Button>
        </CardContent>
      </Card>

      {/* History */}
      <Card className="shadow-card">
        <CardHeader><CardTitle>Emergency History</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                { patient: "David Lee", type: "Heart Attack", location: "321 Elm St", priority: "Critical", status: "Completed" },
                { patient: "Sarah Kim", type: "Fall Injury", location: "654 Maple Ave", priority: "High", status: "Completed" },
                { patient: "Tom Harris", type: "Allergic Reaction", location: "987 Oak Blvd", priority: "Medium", status: "Completed" },
              ].map((h, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{h.patient}</TableCell>
                  <TableCell>{h.type}</TableCell>
                  <TableCell className="text-muted-foreground">{h.location}</TableCell>
                  <TableCell><Badge className={priorityColors[h.priority as keyof typeof priorityColors]}>{h.priority}</Badge></TableCell>
                  <TableCell><Badge className="bg-success/10 text-success border-success/20">{h.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
