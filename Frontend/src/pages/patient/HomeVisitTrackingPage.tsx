import { CheckCircle2, Clock, Truck, MapPin, X, Home, Loader2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ConfirmModal from "@/components/ConfirmModal";
import EmptyState from "@/components/EmptyState";
import { toast } from "sonner";
import api from "@/services/api";

interface TrackingStep {
  key: string;
  label: string;
  status: "done" | "current" | "upcoming";
}

interface TrackingData {
  id: string;
  doctor_name: string | null;
  specialization: string | null;
  date: string;
  time: string;
  address: string;
  notes: string | null;
  status: string;
  steps: TrackingStep[];
}

const stepIcons: Record<string, any> = {
  pending: Clock,
  confirmed: CheckCircle2,
  on_the_way: Truck,
  arrived: MapPin,
  completed: CheckCircle2,
};

export default function HomeVisitTrackingPage() {
  const [showCancel, setShowCancel] = useState(false);
  const [searchParams] = useSearchParams();
  const visitId = searchParams.get("id");
  const queryClient = useQueryClient();

  const { data: tracking, isLoading, isError } = useQuery<TrackingData>({
    queryKey: ["homeVisitTracking", visitId],
    queryFn: async () => {
      const res = await api.get(`/home-visits/${visitId}/track`);
      return res.data;
    },
    enabled: !!visitId,
    refetchInterval: 15000, // Auto-refresh every 15 seconds for real-time updates
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/home-visits/${visitId}/cancel`);
    },
    onSuccess: () => {
      toast.info("Booking cancelled.");
      setShowCancel(false);
      queryClient.invalidateQueries({ queryKey: ["homeVisitTracking", visitId] });
      queryClient.invalidateQueries({ queryKey: ["homeVisits"] });
    },
    onError: () => {
      toast.error("Failed to cancel booking.");
    },
  });

  if (!visitId) {
    return (
      <div className="animate-fade-in">
        <EmptyState
          title="No visit selected"
          description="Please select a home visit from your history to track."
          icon={<Home className="h-8 w-8 text-muted-foreground" />}
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !tracking) {
    return (
      <div className="animate-fade-in">
        <EmptyState
          title="Visit not found"
          description="The home visit could not be found or you don't have access."
          icon={<AlertCircle className="h-8 w-8 text-muted-foreground" />}
        />
      </div>
    );
  }

  const currentStepIndex = tracking.steps.findIndex(s => s.status === "current");
  const progressPercent = tracking.steps.length > 1
    ? (currentStepIndex / (tracking.steps.length - 1)) * 100
    : 0;

  const isCancellable = tracking.status !== "completed" && tracking.status !== "cancelled";

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
            <div className="absolute top-5 left-0 h-0.5 bg-primary transition-all duration-500" style={{ width: `${progressPercent}%` }} />
            {tracking.steps.map((step, i) => {
              const StepIcon = stepIcons[step.key] || Clock;
              return (
                <div key={i} className="relative flex flex-col items-center gap-2 z-10">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                    step.status === "done" ? "bg-primary text-primary-foreground" :
                    step.status === "current" ? "bg-primary text-primary-foreground animate-pulse-slow" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    <StepIcon className="h-5 w-5" />
                  </div>
                  <span className={`text-xs font-medium ${step.status === "upcoming" ? "text-muted-foreground" : "text-foreground"}`}>{step.label}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Doctor Card */}
        <Card className="shadow-card">
          <CardHeader><CardTitle>Assigned Doctor</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full medical-gradient flex items-center justify-center text-primary-foreground font-bold text-lg">
                {(tracking.doctor_name || "??").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{tracking.doctor_name || "Doctor TBD"}</h3>
                <p className="text-sm text-muted-foreground">{tracking.specialization || "-"}</p>
                {tracking.status === "on_the_way" && (
                  <p className="text-sm text-success mt-1">Doctor is on the way</p>
                )}
                {tracking.status === "arrived" && (
                  <p className="text-sm text-success mt-1">Doctor has arrived</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Appointment Details */}
        <Card className="shadow-card">
          <CardHeader><CardTitle>Appointment Details</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground"><Clock className="h-4 w-4" />{tracking.date} at {tracking.time}</div>
            <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-4 w-4" />{tracking.address}</div>
            {tracking.notes && (
              <div className="flex items-center gap-2 text-muted-foreground"><CheckCircle2 className="h-4 w-4" />{tracking.notes}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {isCancellable && (
        <Button
          variant="outline"
          className="text-destructive border-destructive/20 hover:bg-destructive/5"
          onClick={() => setShowCancel(true)}
        >
          <X className="h-4 w-4 mr-2" />Cancel Booking
        </Button>
      )}

      <ConfirmModal
        open={showCancel}
        onOpenChange={setShowCancel}
        title="Cancel Booking"
        description="Are you sure you want to cancel this home visit?"
        onConfirm={() => cancelMutation.mutate()}
        confirmText="Cancel Booking"
        variant="destructive"
      />
    </div>
  );
}
