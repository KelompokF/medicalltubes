import { CheckCircle2, Clock, Truck, MapPin, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import ConfirmModal from "@/components/ConfirmModal";
import { toast } from "sonner";

const steps = [
  { label: "Pending", icon: Clock, status: "done" },
  { label: "Confirmed", icon: CheckCircle2, status: "done" },
  { label: "On The Way", icon: Truck, status: "current" },
  { label: "Completed", icon: CheckCircle2, status: "upcoming" },
];

export default function HomeVisitTrackingPage() {
  const [showCancel, setShowCancel] = useState(false);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Track Home Visit</h1>
        <p className="text-muted-foreground mt-1">Monitor your home visit status in real-time.</p>
      </div>

      {/* Timeline */}
      <Card className="shadow-card">
        <CardHeader><CardTitle>Visit Status</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center justify-between relative">
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-muted" />
            <div className="absolute top-5 left-0 h-0.5 bg-primary" style={{ width: "58%" }} />
            {steps.map((step, i) => (
              <div key={i} className="relative flex flex-col items-center gap-2 z-10">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                  step.status === "done" ? "bg-primary text-primary-foreground" :
                  step.status === "current" ? "bg-primary text-primary-foreground animate-pulse-slow" :
                  "bg-muted text-muted-foreground"
                }`}>
                  <step.icon className="h-5 w-5" />
                </div>
                <span className={`text-xs font-medium ${step.status === "upcoming" ? "text-muted-foreground" : "text-foreground"}`}>{step.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Doctor Card */}
        <Card className="shadow-card">
          <CardHeader><CardTitle>Assigned Doctor</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full medical-gradient flex items-center justify-center text-primary-foreground font-bold text-lg">SJ</div>
              <div>
                <h3 className="font-semibold text-foreground">Dr. Sarah Johnson</h3>
                <p className="text-sm text-muted-foreground">Cardiologist</p>
                <p className="text-sm text-success mt-1">ETA: ~15 minutes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Appointment Details */}
        <Card className="shadow-card">
          <CardHeader><CardTitle>Appointment Details</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground"><Clock className="h-4 w-4" />April 16, 2026 at 10:00 AM</div>
            <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-4 w-4" />123 Main Street, Apt 4B, New York</div>
            <div className="flex items-center gap-2 text-muted-foreground"><CheckCircle2 className="h-4 w-4" />Regular checkup and blood pressure monitoring</div>
          </CardContent>
        </Card>
      </div>

      <Button variant="outline" className="text-destructive border-destructive/20 hover:bg-destructive/5" onClick={() => setShowCancel(true)}>
        <X className="h-4 w-4 mr-2" />Cancel Booking
      </Button>

      <ConfirmModal open={showCancel} onOpenChange={setShowCancel} title="Cancel Booking" description="Are you sure you want to cancel this home visit?" onConfirm={() => { setShowCancel(false); toast.info("Booking cancelled."); }} confirmText="Cancel Booking" variant="destructive" />
    </div>
  );
}
