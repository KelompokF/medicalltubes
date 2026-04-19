import { Phone, MapPin, Clock, AlertTriangle, Shield, Heart, Thermometer } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function EmergencyPage() {
  const ambulances: any[] = [];
  
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">Emergency Services</h1>
        <p className="text-muted-foreground mt-1">Get immediate medical assistance</p>
      </div>

      {/* Emergency Button */}
      <div className="flex justify-center">
        <button
          onClick={() => toast.success("Emergency request sent! Help is on the way.")}
          className="group relative h-40 w-40 rounded-full bg-emergency hover:bg-emergency/90 transition-all duration-300 flex flex-col items-center justify-center shadow-elevated hover:scale-105"
        >
          <div className="absolute inset-0 rounded-full bg-emergency/30 animate-ping" />
          <Phone className="h-10 w-10 text-emergency-foreground mb-1 relative z-10" />
          <span className="text-sm font-bold text-emergency-foreground relative z-10">SOS</span>
        </button>
      </div>

      {/* Location */}
      <Card className="shadow-card">
        <CardContent className="p-5 flex items-center gap-3">
          <div className="rounded-full bg-primary/10 p-3"><MapPin className="h-5 w-5 text-primary" /></div>
          <div>
            <p className="text-sm text-muted-foreground">Current Location</p>
            <p className="font-medium text-foreground">123 Main Street, New York, NY 10001</p>
          </div>
        </CardContent>
      </Card>

      {/* Nearby Ambulances */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3">Nearby Ambulances</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {ambulances.map((amb) => (
            <Card key={amb.id} className="shadow-card hover:shadow-card-hover transition-all">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-foreground text-sm">{amb.name}</h3>
                  <Badge variant={amb.status === "available" ? "default" : "secondary"} className={amb.status === "available" ? "bg-success/10 text-success border-success/20" : ""}>
                    {amb.status}
                  </Badge>
                </div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" />{amb.distance}</p>
                  <p className="flex items-center gap-2"><Clock className="h-3.5 w-3.5" />ETA: {amb.eta}</p>
                </div>
                <Button size="sm" className="w-full mt-3" disabled={amb.status !== "available"} onClick={() => toast.success(`Calling ${amb.name}...`)}>
                  <Phone className="h-3.5 w-3.5 mr-1" />Call Ambulance
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Status Tracker */}
      <Card className="shadow-card border-emergency/20">
        <CardHeader><CardTitle className="flex items-center gap-2 text-emergency"><AlertTriangle className="h-5 w-5" />Emergency Request Status</CardTitle></CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No active emergency requests. Press the SOS button above if you need immediate help.</p>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card className="shadow-card">
        <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-primary" />Emergency Tips</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: Heart, title: "CPR", desc: "Push hard & fast on the center of the chest" },
              { icon: AlertTriangle, title: "Choking", desc: "Perform abdominal thrusts (Heimlich)" },
              { icon: Thermometer, title: "Burns", desc: "Cool the burn under running water for 10 min" },
            ].map((tip) => (
              <div key={tip.title} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <tip.icon className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-foreground text-sm">{tip.title}</p>
                  <p className="text-xs text-muted-foreground">{tip.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
