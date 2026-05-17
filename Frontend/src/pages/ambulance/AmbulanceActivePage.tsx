import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  Clock3,
  Loader2,
  MapPin,
  Navigation,
  Route,
  Siren,
} from "lucide-react";
import { toast } from "sonner";

import EmptyState from "@/components/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { emergencyService } from "@/services/api";
import trackingService from "@/services/trackingService";

import {
  buildMapsUrl,
  buildOsmEmbedUrl,
  formatEmergencyLocation,
  getNextEmergencyStatusAction,
  type ActiveEmergencyItem,
  type EmergencyStatus,
  type UpdatableEmergencyStatus,
} from "./ambulanceActivePage.utils";

interface ActiveEmergenciesResponse {
  data: ActiveEmergencyItem[];
  total: number;
}

const statusConfig: Record<
  string,
  { label: string; className: string; description: string }
> = {
  searching: {
    label: "Searching",
    className: "bg-slate-100 text-slate-700 border-slate-200",
    description: "Sistem sedang mencari unit yang siap.",
  },
  dispatched: {
    label: "Dispatched",
    className: "bg-warning/10 text-warning border-warning/20",
    description: "Kasus sudah ter-assign ke unit ambulans.",
  },
  on_my_way: {
    label: "On My Way",
    className: "bg-primary/10 text-primary border-primary/20",
    description: "Unit sedang menuju titik pasien.",
  },
  on_progress: {
    label: "On Progress",
    className: "bg-emergency/10 text-emergency border-emergency/20",
    description: "Pasien sedang dalam penanganan.",
  },
  completed: {
    label: "Completed",
    className: "bg-success/10 text-success border-success/20",
    description: "Kasus sudah selesai.",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-muted text-muted-foreground border-border",
    description: "Permintaan dibatalkan.",
  },
};

const progressSteps: Array<{
  status: UpdatableEmergencyStatus;
  label: string;
}> = [
  { status: "on_my_way", label: "On My Way" },
  { status: "on_progress", label: "On Progress" },
  { status: "completed", label: "Completed" },
];

function formatDateTime(value: string) {
  const dateStr = value.endsWith("Z") ? value : value + "Z";
  return new Date(dateStr).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusMeta(status: EmergencyStatus) {
  return (
    statusConfig[status] ?? {
      label: status.replace(/_/g, " "),
      className: "bg-muted text-muted-foreground border-border",
      description: "Status belum memiliki deskripsi.",
    }
  );
}

function getProgressStepState(
  currentStatus: EmergencyStatus,
  stepStatus: UpdatableEmergencyStatus,
) {
  const ordering: Record<UpdatableEmergencyStatus, number> = {
    on_my_way: 0,
    on_progress: 1,
    completed: 2,
  };

  if (currentStatus === "searching" || currentStatus === "dispatched") {
    return "upcoming";
  }

  const currentIndex = ordering[currentStatus as UpdatableEmergencyStatus];
  const stepIndex = ordering[stepStatus];

  if (currentIndex === undefined) {
    return "upcoming";
  }

  if (currentIndex > stepIndex) {
    return "done";
  }

  if (currentIndex === stepIndex) {
    return "active";
  }

  return "upcoming";
}

export default function AmbulanceActivePage() {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading, isError, isFetching, refetch } =
    useQuery<ActiveEmergenciesResponse>({
      queryKey: ["ambulanceActiveEmergencies"],
      queryFn: async () => {
        const response = await emergencyService.getActiveEmergencies();
        return response.data;
      },
      staleTime: 15 * 1000,
      refetchInterval: 15 * 1000,
    });

  const requests = data?.data ?? [];
  const selectedRequest =
    requests.find((item) => item.id === selectedId) ?? requests[0] ?? null;
  const progressCount = requests.filter((item) => item.status === "on_progress").length;
  const nearestRequest = requests.reduce<ActiveEmergencyItem | null>((nearest, item) => {
    if (!nearest) {
      return item;
    }

    return item.distance_km < nearest.distance_km ? item : nearest;
  }, null);

  useEffect(() => {
    if (!selectedId && requests.length > 0) {
      setSelectedId(requests[0].id);
      return;
    }

    if (selectedId && requests.length > 0 && !requests.some((item) => item.id === selectedId)) {
      setSelectedId(requests[0].id);
    }
  }, [requests, selectedId]);

  // Auto location sharing for on_my_way status
  useEffect(() => {
    if (!selectedRequest || selectedRequest.status !== "on_my_way") {
      return;
    }

    let intervalId: NodeJS.Timeout | null = null;
    let isActive = true;

    const updateLocation = () => {
      if (!isActive) return;

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          if (!isActive) return;

          try {
            await trackingService.updateLocation({
              emergency_request_id: selectedRequest.id,
              location: {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
              },
            });
          } catch (error) {
            console.error("Failed to update location:", error);
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
          if (error.code === error.PERMISSION_DENIED) {
            toast.error("Location permission denied. Please enable location access.");
            isActive = false;
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    };

    // Initial update
    updateLocation();

    // Set up interval for updates every 5 seconds
    intervalId = setInterval(updateLocation, 5000);

    return () => {
      isActive = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [selectedRequest]);

  const updateStatus = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: UpdatableEmergencyStatus;
    }) => emergencyService.updateActiveEmergencyStatus(id, status),
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["ambulanceActiveEmergencies"] }),
        queryClient.invalidateQueries({ queryKey: ["ambulanceEmergencyHistory"] }),
      ]);

      toast.success(`Status updated to ${getStatusMeta(variables.status).label}`);
    },
    onError: () => {
      toast.error("Gagal memperbarui status emergency. Silakan coba lagi.");
    },
  });

  const renderActionButton = (item: ActiveEmergencyItem) => {
    const action = getNextEmergencyStatusAction(item.status);
    if (!action) {
      return (
        <Button className="w-full sm:w-auto" variant="outline" disabled>
          Case Closed
        </Button>
      );
    }

    const isPending =
      updateStatus.isPending &&
      updateStatus.variables?.id === item.id &&
      updateStatus.variables?.status === action.status;

    return (
      <Button
        className={cn(
          "w-full sm:w-auto",
          action.tone === "success" && "bg-success text-success-foreground hover:bg-success/90",
          action.tone === "danger" && "bg-emergency text-emergency-foreground hover:bg-emergency/90",
        )}
        disabled={updateStatus.isPending}
        onClick={() => updateStatus.mutate({ id: item.id, status: action.status })}
      >
        {isPending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <ArrowRight className="mr-2 h-4 w-4" />
        )}
        {action.label}
      </Button>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <section className="overflow-hidden rounded-[28px] border border-primary/10 bg-card shadow-card">
        <div className="relative p-5 sm:p-6 lg:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_hsl(var(--primary)/0.12),_transparent_40%),radial-gradient(circle_at_top_right,_hsl(var(--warning)/0.14),_transparent_34%),linear-gradient(135deg,_hsl(var(--background)),_hsl(var(--card)))]" />
          <div className="relative space-y-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emergency/15 bg-emergency/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emergency">
                  <Siren className="h-3.5 w-3.5" />
                  Emergency Active Board
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  Lokasi pasien aktif untuk unit ambulans
                </h1>
                <p className="mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">
                  Pantau titik penjemputan, buka navigasi instan, lalu update progres
                  penanganan dari satu layar yang ringkas.
                </p>
              </div>
              <Button
                variant="outline"
                className="w-full bg-background/80 sm:w-auto"
                onClick={() => refetch()}
                disabled={isFetching}
              >
                {isFetching ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <AlertTriangle className="mr-2 h-4 w-4" />
                )}
                Refresh Cases
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <Card className="border-white/40 bg-white/80 shadow-none">
                <CardContent className="p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Active Request
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-foreground">
                    {data?.total ?? 0}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Kasus aktif yang masih ditangani
                  </p>
                </CardContent>
              </Card>
              <Card className="border-white/40 bg-white/80 shadow-none">
                <CardContent className="p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Nearest Pickup
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-foreground">
                    {nearestRequest ? `${nearestRequest.distance_km.toFixed(1)} km` : "-"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Jarak terdekat dari base ambulans
                  </p>
                </CardContent>
              </Card>
              <Card className="border-white/40 bg-white/80 shadow-none">
                <CardContent className="p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    On Progress
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-foreground">
                    {progressCount}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Pasien yang sedang ditangani
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {isLoading ? (
        <Card className="shadow-card">
          <CardContent className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      ) : isError ? (
        <Card className="shadow-card">
          <CardContent className="space-y-4 p-6">
            <EmptyState
              title="Gagal memuat emergency aktif"
              description="Data pasien aktif belum bisa diambil. Coba refresh lagi."
            />
            <div className="flex justify-center">
              <Button variant="outline" onClick={() => refetch()}>
                Coba Lagi
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : requests.length === 0 ? (
        <Card className="shadow-card">
          <CardContent className="p-6">
            <EmptyState
              title="Belum ada emergency aktif"
              description="Saat ini belum ada pasien yang di-assign ke unit ambulans ini."
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_420px]">
          <section className="space-y-4">
            {requests.map((item) => {
              const status = getStatusMeta(item.status);
              const isSelected = selectedRequest?.id === item.id;
              const isPendingItem =
                updateStatus.isPending && updateStatus.variables?.id === item.id;

              return (
                <Card
                  key={item.id}
                  className={cn(
                    "overflow-hidden border-border/80 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-card-hover",
                    isSelected && "border-primary/30 ring-2 ring-primary/10",
                  )}
                >
                  <CardContent className="p-0">
                    <div
                      role="button"
                      tabIndex={0}
                      className="w-full text-left outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                      onClick={() => setSelectedId(item.id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setSelectedId(item.id);
                        }
                      }}
                    >
                      <div className="card-gradient border-b border-border/70 px-4 py-4 sm:px-5">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="min-w-0 space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge className={status.className}>{status.label}</Badge>
                              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock3 className="h-3.5 w-3.5" />
                                {formatDateTime(item.created_at)}
                              </span>
                              {isPendingItem && (
                                <span className="inline-flex items-center gap-1 text-xs text-primary">
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  Updating
                                </span>
                              )}
                            </div>
                            <div>
                              <h2 className="text-lg font-semibold text-foreground">
                                {item.user_name || "Pasien tidak diketahui"}
                              </h2>
                              <p className="text-sm capitalize text-muted-foreground">
                                {item.type.replace(/_/g, " ")}
                              </p>
                            </div>
                            <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                              <div className="flex items-start gap-2">
                                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emergency" />
                                <span className="line-clamp-2">
                                  {formatEmergencyLocation(item)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Route className="h-4 w-4 shrink-0 text-primary" />
                                <span>{item.distance_km.toFixed(2)} km dari base</span>
                              </div>
                            </div>
                            {item.notes && (
                              <p className="rounded-2xl border border-border/60 bg-background/80 px-3 py-2 text-sm text-muted-foreground">
                                {item.notes}
                              </p>
                            )}
                          </div>

                          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row lg:flex-col">
                            <Button
                              variant="outline"
                              className="w-full bg-background/80 sm:w-auto"
                              asChild
                            >
                              <a
                                href={buildMapsUrl(item)}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(event) => event.stopPropagation()}
                              >
                                <Navigation className="mr-2 h-4 w-4" />
                                Open Maps
                              </a>
                            </Button>
                            <div onClick={(event) => event.stopPropagation()}>
                              {renderActionButton(item)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </section>

          {selectedRequest && (
            <aside className="xl:sticky xl:top-24 xl:h-fit">
              <Card className="overflow-hidden border-primary/10 shadow-card">
                <CardHeader className="border-b border-border/70 bg-gradient-to-br from-primary/10 via-background to-warning/10">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Selected Emergency
                      </p>
                      <CardTitle className="mt-2 text-xl">
                        {selectedRequest.user_name || "Pasien tidak diketahui"}
                      </CardTitle>
                      <p className="mt-1 text-sm capitalize text-muted-foreground">
                        {selectedRequest.type.replace(/_/g, " ")}
                      </p>
                    </div>
                    <Badge className={getStatusMeta(selectedRequest.status).className}>
                      {getStatusMeta(selectedRequest.status).label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5 p-5">
                  <div className="overflow-hidden rounded-3xl border border-border/70 bg-muted/30">
                    <iframe
                      title={`Map for ${selectedRequest.user_name || selectedRequest.id}`}
                      src={buildOsmEmbedUrl(selectedRequest)}
                      className="h-64 w-full"
                      loading="lazy"
                    />
                  </div>

                  <div className="rounded-3xl border border-border/70 bg-card p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Patient Location
                    </p>
                    <p className="mt-2 font-medium text-foreground">
                      {formatEmergencyLocation(selectedRequest)}
                    </p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl bg-muted/60 p-3">
                        <p className="text-xs text-muted-foreground">Latitude</p>
                        <p className="mt-1 font-semibold text-foreground">
                          {selectedRequest.location_lat.toFixed(5)}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-muted/60 p-3">
                        <p className="text-xs text-muted-foreground">Longitude</p>
                        <p className="mt-1 font-semibold text-foreground">
                          {selectedRequest.location_lng.toFixed(5)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-border/70 bg-card p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Status Flow
                    </p>
                    <div className="mt-4 space-y-3">
                      {progressSteps.map((step, index) => {
                        const state = getProgressStepState(selectedRequest.status, step.status);
                        return (
                          <div key={step.status} className="flex items-center gap-3">
                            <div className="flex flex-col items-center">
                              <div
                                className={cn(
                                  "flex h-9 w-9 items-center justify-center rounded-full border text-xs font-semibold",
                                  state === "done" &&
                                    "border-success/20 bg-success/10 text-success",
                                  state === "active" &&
                                    "border-primary/20 bg-primary/10 text-primary",
                                  state === "upcoming" &&
                                    "border-border bg-muted text-muted-foreground",
                                )}
                              >
                                {index + 1}
                              </div>
                              {index < progressSteps.length - 1 && (
                                <div
                                  className={cn(
                                    "my-1 h-6 w-px",
                                    state === "done" ? "bg-success/40" : "bg-border",
                                  )}
                                />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{step.label}</p>
                              <p className="text-sm text-muted-foreground">
                                {state === "done"
                                  ? "Step selesai"
                                  : state === "active"
                                    ? "Sedang berjalan"
                                    : "Menunggu langkah berikutnya"}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <p className="mt-4 text-sm text-muted-foreground">
                      {getStatusMeta(selectedRequest.status).description}
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button className="flex-1" asChild>
                      <a
                        href={buildMapsUrl(selectedRequest)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Navigation className="mr-2 h-4 w-4" />
                        Navigate to Patient
                      </a>
                    </Button>
                    <div className="flex-1">{renderActionButton(selectedRequest)}</div>
                  </div>
                </CardContent>
              </Card>
            </aside>
          )}
        </div>
      )}
    </div>
  );
}
