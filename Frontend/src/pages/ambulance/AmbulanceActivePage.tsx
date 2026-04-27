import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ambulanceService } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Truck, CheckCircle, Navigation, ExternalLink, Clock, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorAlert from "@/components/ErrorAlert";
import EmptyState from "@/components/EmptyState";

interface EmergencyRequest {
  id: string;
  patient_name: string;
  status: string;
  lat: number;
  lng: number;
  emergency_type: string;
  notes: string;
  created_at: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "Menunggu", color: "bg-warning/10 text-warning border-warning/20", icon: Clock },
  dispatched: { label: "Ditugaskan", color: "bg-primary/10 text-primary border-primary/20", icon: AlertTriangle },
  on_route: { label: "Dalam Perjalanan", color: "bg-info/10 text-info border-info/20", icon: Truck },
  arrived: { label: "Sampai di Lokasi", color: "bg-success/10 text-success border-success/20", icon: CheckCircle },
};

export default function AmbulanceActivePage() {
  const queryClient = useQueryClient();

  const { data: requests, isLoading, isError, error } = useQuery({
    queryKey: ["active-emergencies"],
    queryFn: async () => {
      const response = await ambulanceService.getActiveRequests();
      return response.data as EmergencyRequest[];
    },
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => 
      ambulanceService.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["active-emergencies"] });
      toast.success("Status berhasil diperbarui");
    },
    onError: () => {
      toast.error("Gagal memperbarui status");
    }
  });

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <ErrorAlert message={(error as any)?.message || "Gagal memuat data"} />;

  const handleUpdateStatus = (id: string, currentStatus: string) => {
    let nextStatus = "";
    if (currentStatus === "dispatched" || currentStatus === "pending") nextStatus = "on_route";
    else if (currentStatus === "on_route") nextStatus = "arrived";
    else if (currentStatus === "arrived") nextStatus = "completed";

    if (nextStatus) {
      updateStatusMutation.mutate({ id, status: nextStatus });
    }
  };

  const openInGoogleMaps = (lat: number, lng: number) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    window.open(url, "_blank");
  };

  if (!requests || requests.length === 0) {
    return (
      <EmptyState 
        title="Tidak Ada Emergency Aktif" 
        description="Saat ini tidak ada permintaan darurat yang ditugaskan kepada Anda."
        icon={AlertTriangle}
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Emergency Aktif</h1>
        <Badge variant="outline" className="px-3 py-1">
          {requests.length} Permintaan
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {requests.map((req) => {
          const status = statusConfig[req.status] || statusConfig.pending;
          const StatusIcon = status.icon;

          return (
            <Card key={req.id} className="shadow-card border-l-4 border-l-emergency overflow-hidden">
              <CardHeader className="pb-3 border-b bg-muted/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-full ${status.color}`}>
                      <StatusIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{req.patient_name}</CardTitle>
                      <p className="text-xs text-muted-foreground">ID: {req.id.slice(0, 8)}...</p>
                    </div>
                  </div>
                  <Badge className={status.color}>{status.label}</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">Informasi Darurat</h4>
                      <p className="font-medium text-foreground text-lg">{req.emergency_type}</p>
                      {req.notes && (
                        <p className="text-sm text-muted-foreground mt-1 bg-muted p-2 rounded italic">
                          "{req.notes}"
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-muted rounded-lg">
                        <MapPin className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Lokasi Koordinat</h4>
                        <p className="text-sm font-mono">{req.lat.toFixed(6)}, {req.lng.toFixed(6)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-muted rounded-lg">
                        <Clock className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Waktu Permintaan</h4>
                        <p className="text-sm">{new Date(req.created_at).toLocaleString('id-ID')}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col justify-center gap-3">
                    <Button 
                      onClick={() => openInGoogleMaps(req.lat, req.lng)}
                      className="w-full bg-[#4285F4] hover:bg-[#357ae8] text-white font-bold h-12 gap-2"
                    >
                      <Navigation className="h-5 w-5" />
                      Buka Navigasi (Google Maps)
                      <ExternalLink className="h-4 w-4 ml-auto opacity-70" />
                    </Button>

                    <div className="grid grid-cols-1 gap-2 mt-2">
                      {req.status === "dispatched" || req.status === "pending" ? (
                        <Button 
                          onClick={() => handleUpdateStatus(req.id, req.status)}
                          className="w-full medical-gradient text-white h-12 gap-2"
                          disabled={updateStatusMutation.isPending}
                        >
                          <Truck className="h-5 w-5" />
                          Mulai Perjalanan (On Route)
                        </Button>
                      ) : req.status === "on_route" ? (
                        <Button 
                          onClick={() => handleUpdateStatus(req.id, req.status)}
                          variant="outline"
                          className="w-full border-success text-success hover:bg-success/10 h-12 gap-2"
                          disabled={updateStatusMutation.isPending}
                        >
                          <CheckCircle className="h-5 w-5" />
                          Sudah Sampai di Lokasi
                        </Button>
                      ) : req.status === "arrived" ? (
                        <Button 
                          onClick={() => handleUpdateStatus(req.id, req.status)}
                          className="w-full bg-success hover:bg-success/90 text-white h-12 gap-2"
                          disabled={updateStatusMutation.isPending}
                        >
                          <CheckCircle className="h-5 w-5" />
                          Selesaikan Tugas
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
