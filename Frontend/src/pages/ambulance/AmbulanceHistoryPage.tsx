import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Clock3, MapPin, Route, FileText, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import EmptyState from "@/components/EmptyState";
import { emergencyService } from "@/services/api";

type HistoryFilter = "all" | "today" | "yesterday" | "last_7_days" | "this_month";

interface EmergencyHistoryItem {
  id: string;
  user_id?: string | null;
  user_name?: string | null;
  created_at: string;
  location_address?: string | null;
  location_lat: number;
  location_lng: number;
  distance_km: number;
  status: string;
  type: string;
  notes?: string | null;
}

interface EmergencyHistoryPagination {
  page: number;
  limit: number;
  total_items: number;
  total_pages: number;
}

interface EmergencyHistoryResponse {
  data: EmergencyHistoryItem[];
  pagination: EmergencyHistoryPagination;
}

const filterOptions: Array<{ value: HistoryFilter; label: string }> = [
  { value: "all", label: "Semua" },
  { value: "today", label: "Hari Ini" },
  { value: "yesterday", label: "Kemarin" },
  { value: "last_7_days", label: "7 Hari Terakhir" },
  { value: "this_month", label: "Bulan Ini" },
];

const statusConfig: Record<string, { label: string; className: string }> = {
  dispatched: {
    label: "Dispatched",
    className: "bg-warning/10 text-warning border-warning/20",
  },
  arrived: {
    label: "Arrived",
    className: "bg-primary/10 text-primary border-primary/20",
  },
  completed: {
    label: "Completed",
    className: "bg-success/10 text-success border-success/20",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-muted text-muted-foreground border-border",
  },
};

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AmbulanceHistoryPage() {
  const [filter, setFilter] = useState<HistoryFilter>("all");
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading, isError, isFetching } = useQuery<EmergencyHistoryResponse>({
    queryKey: ["ambulanceEmergencyHistory", filter, page, limit],
    queryFn: async () => {
      const response = await emergencyService.getEmergencyHistory({ filter, page, limit });
      return response.data;
    },
    placeholderData: (prev) => prev,
  });

  const history = data?.data ?? [];
  const pagination = data?.pagination;
  const totalItems = pagination?.total_items ?? 0;
  const totalPages = pagination?.total_pages ?? 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Riwayat Emergency</h1>
          <p className="text-sm text-muted-foreground">
            Dokumentasi layanan darurat yang pernah ditangani
          </p>
        </div>
        <Badge variant="secondary" className="w-fit text-sm">
          {totalItems} record
        </Badge>
      </div>

      <Card className="shadow-card">
        <CardContent className="p-4 sm:p-5">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {filterOptions.map((option) => (
              <Button
                key={option.value}
                variant={filter === option.value ? "default" : "outline"}
                size="sm"
                className="whitespace-nowrap"
                onClick={() => {
                  setFilter(option.value);
                  setPage(1);
                }}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
            </div>
          ) : isError ? (
            <EmptyState
              title="Gagal memuat riwayat"
              description="Silakan coba lagi beberapa saat lagi."
            />
          ) : history.length === 0 ? (
            <EmptyState
              title="Riwayat belum tersedia"
              description="Belum ada permintaan emergency pada rentang waktu ini."
            />
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-[980px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Pasien</TableHead>
                    <TableHead>Waktu</TableHead>
                    <TableHead>Lokasi</TableHead>
                    <TableHead>Jenis</TableHead>
                    <TableHead>Jarak</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Catatan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((item) => {
                    const status = statusConfig[item.status] ?? {
                      label: item.status,
                      className: "bg-muted text-muted-foreground border-border",
                    };
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          <div className="space-y-1">
                            <p className="text-sm font-semibold text-foreground">
                              {item.user_name || "Pasien tidak diketahui"}
                            </p>
                            {item.user_id && (
                              <p className="text-xs text-muted-foreground">
                                {item.user_id.slice(0, 8)}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Clock3 className="h-4 w-4 text-muted-foreground" />
                            <span>{formatDateTime(item.created_at)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[320px] space-y-1">
                            <div className="flex items-start gap-2 text-sm">
                              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                              <span className="line-clamp-2">
                                {item.location_address || `${item.location_lat.toFixed(5)}, ${item.location_lng.toFixed(5)}`}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="capitalize">{item.type}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm">
                            <Route className="h-4 w-4 text-muted-foreground" />
                            <span>{item.distance_km.toFixed(2)} km</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={status.className}>{status.label}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex max-w-[240px] items-start gap-2 text-sm text-muted-foreground">
                            <FileText className="mt-0.5 h-4 w-4 shrink-0" />
                            <span className="line-clamp-2">{item.notes || "-"}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {totalPages > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Halaman {page} dari {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page <= 1 || isFetching}
            >
              <ChevronLeft className="h-4 w-4" />
              Sebelumnya
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={page >= totalPages || isFetching}
            >
              Berikutnya
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
