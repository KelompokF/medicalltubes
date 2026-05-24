import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Home, Calendar, MapPin, Search, Filter, Eye,
  CheckCircle, XCircle, Loader2, Clock, Phone, FileText, Stethoscope
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import EmptyState from "@/components/EmptyState";
import { toast } from "sonner";
import api from "@/services/api";
import { useState as useStateReact, useEffect } from "react";

/* =========================
   TYPE GABUNGAN (AMAN)
========================= */
interface HomeVisitItem {
  id: string;
  user_id?: string;
  patient_id?: string;
  doctor_id?: string | null;
  doctor_name?: string | null;
  specialization?: string | null;
  patient_name?: string;
  address: string;
  phone_number?: string;
  complaint?: string;
  preferred_date?: string;
  preferred_time?: string;
  date?: string;
  time?: string;
  notes?: string | null;
  status:
    | "pending"
    | "approved"
    | "rejected"
    | "completed"
    | "confirmed"
    | "on_the_way"
    | "arrived"
    | "cancelled";
  created_at: string;
}

/* =========================
   FORMAT DATE
========================= */
function formatDate(dateStr?: string) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function HomeVisitHistoryPage() {
  const { t } = useTranslation();
  const [visits, setVisits] = useState<HomeVisitItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  /* =========================
     STATUS CONFIG GABUNGAN
  ========================= */
  const statusConfig: Record<
    HomeVisitItem["status"],
    { label: string; color: string; icon: React.ElementType }
  > = {
    pending: {
      label: t("patient.homeVisitHistory.statusPending"),
      color: "bg-warning/10 text-warning border-warning/20",
      icon: Loader2,
    },
    approved: {
      label: t("patient.homeVisitHistory.statusApproved"),
      color: "bg-primary/10 text-primary border-primary/20",
      icon: Clock,
    },
    rejected: {
      label: t("patient.homeVisitHistory.statusRejected"),
      color: "bg-destructive/10 text-destructive border-destructive/20",
      icon: XCircle,
    },
    completed: {
      label: t("patient.homeVisitHistory.statusCompleted"),
      color: "bg-success/10 text-success border-success/20",
      icon: CheckCircle,
    },
    confirmed: {
      label: t("patient.homeVisitHistory.statusConfirmed"),
      color: "bg-primary/10 text-primary border-primary/20",
      icon: Clock,
    },
    on_the_way: {
      label: t("patient.homeVisitHistory.statusOnTheWay"),
      color: "bg-primary/10 text-primary border-primary/20",
      icon: Clock,
    },
    arrived: {
      label: t("patient.homeVisitHistory.statusArrived"),
      color: "bg-success/10 text-success border-success/20",
      icon: CheckCircle,
    },
    cancelled: {
      label: t("patient.homeVisitHistory.statusCancelled"),
      color: "bg-destructive/10 text-destructive border-destructive/20",
      icon: XCircle,
    },
  };

  /* =========================
     FETCH DATA (PAKAI PUNYA LU)
  ========================= */
  useEffect(() => {
    const fetchVisits = async () => {
      try {
        const res = await api.get("/home-visits/");
        // Only show completed home visits as requested
        const completedVisits = res.data.filter((v: HomeVisitItem) => v.status === "completed");
        setVisits(completedVisits);
      } catch (err) {
        toast.error(t("patient.homeVisitHistory.loadFailed"));
      } finally {
        setIsLoading(false);
      }
    };
    fetchVisits();
  }, []);

  const filtered = visits.filter((visit) => {
    const keyword = search.toLowerCase();

    const matchesSearch =
      (visit.patient_name || "").toLowerCase().includes(keyword) ||
      (visit.doctor_name || "").toLowerCase().includes(keyword) ||
      visit.address.toLowerCase().includes(keyword) ||
      (visit.complaint || "").toLowerCase().includes(keyword);

    const matchesStatus =
      statusFilter === "all" || visit.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("patient.homeVisitHistory.title")}</h1>

      {/* SEARCH */}
      <div className="flex gap-3">
        <Input
          placeholder={t("patient.homeVisitHistory.searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("patient.homeVisitHistory.allFilter")}</SelectItem>
            {Object.keys(statusConfig).map((s) => (
              <SelectItem key={s} value={s}>
                {statusConfig[s as keyof typeof statusConfig].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* LIST */}
      {filtered.length === 0 ? (
        <EmptyState title={t("patient.homeVisitHistory.noData")} />
      ) : (
        filtered.map((visit) => {
          const config = statusConfig[visit.status] || statusConfig.pending;
          const Icon = config.icon;

          return (
            <Card key={visit.id}>
              <CardContent className="p-4">
                <div className="flex justify-between">
                  <div>
                    <h3 className="font-semibold">
                      {visit.patient_name || visit.doctor_name || "-"}
                    </h3>

                    <p className="text-sm text-muted-foreground">
                      {formatDate(visit.preferred_date || visit.date)} -{" "}
                      {visit.preferred_time || visit.time || "--:--"}
                    </p>

                    <p className="text-sm">{visit.address}</p>
                  </div>

                  <Badge className={config.color}>
                    <Icon className="h-3 w-3 mr-1" />
                    {config.label}
                  </Badge>
                </div>

                <div className="mt-3 flex gap-2">
                  <Button size="sm" asChild>
                    <Link to={`/home-visit-detail/${visit.id}`}>
                      <Eye className="h-4 w-4 mr-1" /> {t("common.detail")}
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}