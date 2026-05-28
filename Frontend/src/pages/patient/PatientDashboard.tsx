import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { authService, patientService } from "@/services/api";
import { Activity, Home, AlertTriangle, Pill, Search, Phone, Calendar, MessageSquare, ArrowRight, RefreshCcw, Stethoscope, Filter, FileText, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StatCard from "@/components/StatCard";

export default function PatientDashboard() {
  const { t } = useTranslation();
  const { data: meData } = useQuery({
    queryKey: ["me"],
    queryFn: () => authService.getMe().then((res) => res.data),
    staleTime: 1000 * 60 * 5
  });
  const firstName = meData?.full_name?.split(" ")[0] || "Pasien";

  const { data: dashboardData, isLoading, isError, refetch } = useQuery({
    queryKey: ["patientDashboard"],
    queryFn: () => patientService.getDashboard().then((res) => res.data),
  });

  const patientStats = dashboardData?.stats || {
    totalConsultations: 0,
    homeVisitBookings: 0,
    emergencyRequests: 0,
    activePrescriptions: 0,
  };

  const upcomingAppointment = dashboardData?.upcomingAppointment || null;
  const consultationHistory = dashboardData?.consultationHistory || [];
  const bookingHistory = dashboardData?.bookingHistory || [];

  const getInitials = (name: string) => {
    if (!name) return "DR";
    const parts = name.split(' ').filter(n => n.length > 0);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s === "selesai" || s === "completed") return "bg-success/10 text-success";
    if (s === "dibatalkan" || s === "cancelled") return "bg-destructive/10 text-destructive";
    if (s === "aktif" || s === "active") return "bg-primary/10 text-primary";
    if (s === "menunggu" || s === "pending") return "bg-warning/10 text-warning";
    return "bg-muted text-muted-foreground";
  };

  const HistoryList = ({ items, icon: Icon, title, isChat }: { items: any[], icon: any, title: string, isChat?: boolean }) => (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-primary">
          <Icon className="h-5 w-5" />
          <h3 className="font-semibold text-foreground">{title}</h3>
        </div>
        <Button variant="ghost" size="sm" className="h-8 gap-1 text-primary hover:bg-primary/10" asChild>
          <Link to={isChat ? "/chat-history" : "/tracking"}>
            <span className="text-xs font-semibold">{t("common.viewAll")}</span> <ArrowRight className="h-3 w-3 ml-1" />
          </Link>
        </Button>
      </div>

      {items.length > 0 ? (
        <div className="space-y-1">
          {items.map((item: any) => (
            <div key={item.id} className="flex justify-between items-center p-3 hover:bg-muted/40 rounded-xl transition-colors">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 p-2 bg-primary/10 rounded-full text-primary">
                  {isChat ? <MessageSquare className="h-4 w-4" /> : <Calendar className="h-4 w-4" />}
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-foreground">{item.doctor}</h4>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                    <span>{item.specialization}</span>
                    <span className="w-1 h-1 rounded-full bg-muted-foreground/30"></span>
                    <span>{item.date} • {item.time}</span>
                  </div>
                </div>
              </div>
              <div className={`px-2.5 py-1 rounded-full text-[10px] font-medium whitespace-nowrap ${getStatusBadge(item.status)}`}>
                {t(`patient.dashboard.status.${item.status.toLowerCase()}`, item.status.charAt(0).toUpperCase() + item.status.slice(1))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 flex flex-col items-center border rounded-xl bg-muted/30">
          <Activity className="h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground text-sm font-medium">{t("patient.dashboard.noHistory")}</p>
        </div>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[60vh] space-y-4">
        <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
        <p className="text-muted-foreground font-medium animate-pulse">{t("patient.dashboard.loadingDashboard")}</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[60vh] space-y-4 text-center">
        <AlertTriangle className="h-16 w-16 text-destructive opacity-80" />
        <h3 className="text-xl font-bold text-foreground">{t("patient.dashboard.errorOccurred")}</h3>
        <p className="text-muted-foreground">{t("patient.dashboard.failedLoadDashboard")}</p>
        <Button onClick={() => refetch()} className="mt-4 gap-2">
          <RefreshCcw className="h-4 w-4" /> {t("patient.dashboard.tryAgain")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl medical-gradient p-6 sm:p-8 text-primary-foreground shadow-lg">
        <div className="relative z-10">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2 tracking-tight">{t("patient.dashboard.welcomeBack", { name: firstName })}</h1>
          <p className="text-primary-foreground/90 text-sm sm:text-base font-medium max-w-xl">
            {t("patient.dashboard.howAreYou")}
          </p>
        </div>
        <div className="absolute right-0 top-0 opacity-10 pointer-events-none">
          <Activity className="w-64 h-64 -mt-16 -mr-16" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title={t("patient.dashboard.totalConsultations")} value={patientStats.totalConsultations} icon={Activity} variant="primary" />
        <StatCard title={t("patient.dashboard.homeVisitBookings")} value={patientStats.homeVisitBookings} icon={Home} variant="success" />
        <StatCard title={t("patient.dashboard.emergencyRequests")} value={patientStats.emergencyRequests} icon={AlertTriangle} variant="emergency" />
        <StatCard title={t("patient.dashboard.activePrescriptions")} value={patientStats.activePrescriptions} icon={Pill} variant="warning" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          {/* Quick Actions */}
          <Card className="shadow-card border-none hover:shadow-card-hover transition-shadow duration-300">
            <CardHeader className="pb-3"><CardTitle className="text-lg">{t("patient.dashboard.quickActions")}</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              {[
                { label: t("patient.dashboard.searchDoctor"), icon: Search, path: "/search-doctor", color: "bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground" },
                { label: t("patient.dashboard.emergency"), icon: Phone, path: "/emergency", color: "bg-emergency/10 text-emergency hover:bg-emergency hover:text-emergency-foreground" },
                { label: t("patient.dashboard.homeVisit"), icon: Home, path: "/home-visit", color: "bg-success/10 text-success hover:bg-success hover:text-success-foreground" },
                { label: t("patient.dashboard.startConsultation"), icon: MessageSquare, path: "/chat", color: "bg-accent/10 text-accent hover:bg-accent hover:text-accent-foreground" },
              ].map((action) => (
                <Link key={action.label} to={action.path} className="group">
                  <div className={`flex flex-col items-center justify-center gap-3 p-4 rounded-xl ${action.color} transition-all duration-300 ease-in-out cursor-pointer h-full border border-transparent min-h-[100px]`}>
                    <action.icon className="h-6 w-6 transition-transform group-hover:scale-110" />
                    <span className="text-xs font-semibold text-center leading-tight">{action.label}</span>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>

          {/* Upcoming Appointment */}
          <Card className="shadow-card border-none hover:shadow-card-hover transition-shadow duration-300">
            <CardHeader className="pb-3"><CardTitle className="text-lg">{t("patient.dashboard.upcomingSchedule")}</CardTitle></CardHeader>
            <CardContent>
              {upcomingAppointment ? (
                <div className="flex flex-col h-full justify-between">
                  <div>
                    <div className="flex items-center gap-4 mb-5 p-3 rounded-xl bg-muted/30">
                      <div className="h-12 w-12 rounded-full medical-gradient flex items-center justify-center text-primary-foreground font-bold text-lg shadow-sm">
                        {getInitials(upcomingAppointment.doctor)}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground text-base">{upcomingAppointment.doctor}</p>
                        <p className="text-sm text-muted-foreground font-medium">{upcomingAppointment.specialization}</p>
                      </div>
                    </div>
                    <div className="space-y-3 text-sm px-1">
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                          <Calendar className="h-4 w-4" />
                        </div>
                        <span className="font-medium">{upcomingAppointment.date} pada {upcomingAppointment.time}</span>
                      </div>
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <div className="p-2 bg-accent/10 rounded-lg text-accent">
                          <MessageSquare className="h-4 w-4" />
                        </div>
                        <span className="font-medium">{upcomingAppointment.type}</span>
                      </div>
                    </div>
                  </div>
                  <Button className="w-full mt-6 shadow-sm hover:shadow-md transition-all" size="default" asChild>
                    <Link to="/chat">{t("patient.dashboard.joinConsultation")}</Link>
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8 flex flex-col items-center justify-center h-full">
                  <div className="h-16 w-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
                    <Calendar className="h-8 w-8 text-muted-foreground/70" />
                  </div>
                  <p className="text-muted-foreground text-sm font-medium mb-1">{t("patient.dashboard.noUpcomingSchedule")}</p>
                  <p className="text-xs text-muted-foreground/70 mb-6">{t("patient.dashboard.allScheduleCompleted")}</p>
                  <Button className="w-full" size="sm" variant="outline" asChild>
                    <Link to="/search-doctor">{t("patient.dashboard.makeAppointment")}</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* History Tabs */}
        <div className="lg:col-span-2">
          <Card className="shadow-card border-none hover:shadow-card-hover transition-shadow duration-300 h-full">
            <CardContent className="p-6">
              <Tabs defaultValue="consultation" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-6 bg-muted/50 p-1 rounded-xl">
                  <TabsTrigger value="consultation" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    {t("patient.dashboard.consultationHistory")}
                  </TabsTrigger>
                  <TabsTrigger value="booking" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    {t("patient.dashboard.bookingHistory")}
                  </TabsTrigger>
                  <TabsTrigger value="prescription" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    {t("patient.dashboard.prescriptions", "Resep Obat")}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="consultation" className="mt-0 animate-fade-in border-none outline-none">
                  <HistoryList items={consultationHistory} icon={MessageSquare} title={t("patient.dashboard.chatHistory")} isChat={true} />
                </TabsContent>

                <TabsContent value="booking" className="mt-0 animate-fade-in border-none outline-none">
                  <HistoryList items={bookingHistory} icon={Home} title={t("patient.dashboard.homeVisitHistory")} isChat={false} />
                </TabsContent>

                <TabsContent value="prescription" className="mt-0 animate-fade-in border-none outline-none">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2 text-primary">
                        <Pill className="h-5 w-5" />
                        <h3 className="font-semibold text-foreground">{t("patient.dashboard.prescriptionList", "Daftar Resep Obat")}</h3>
                      </div>
                    </div>

                    {(dashboardData?.prescriptions || []).length > 0 ? (
                      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                        {(dashboardData.prescriptions).map((pres: any) => (
                          <div key={pres.id} className="border border-border/80 rounded-xl overflow-hidden bg-card shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300">
                            <div className="bg-primary/5 px-4 py-3 border-b flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                  {getInitials(pres.doctor)}
                                </div>
                                <span className="font-bold text-sm text-foreground">{pres.doctor}</span>
                              </div>
                              <span className="text-[11px] text-muted-foreground bg-muted/70 px-2 py-0.5 rounded-md font-medium">{pres.date}</span>
                            </div>
                            <div className="p-4 space-y-3">
                              <div className="space-y-2">
                                {pres.medications.map((med: any, midx: number) => (
                                  <div key={midx} className="flex items-start gap-3 p-3 rounded-lg bg-muted/20 border border-border/30 hover:bg-muted/40 transition-colors">
                                    <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                      <span className="text-xs font-bold text-primary">{midx + 1}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-bold text-sm text-foreground">{med.name}</p>
                                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                                          <span className="font-semibold text-foreground/70">{t("patient.dashboard.dosage", "Dosis:")}</span> {med.dosage}
                                        </p>
                                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                                          <span className="font-semibold text-foreground/70">{t("patient.dashboard.duration", "Durasi:")}</span> {med.duration}
                                        </p>
                                      </div>
                                      <p className="text-xs text-primary font-medium mt-1.5 flex items-center gap-1">
                                        <ChevronRight className="h-3.5 w-3.5 animate-pulse" /> {med.instructions}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              {pres.notes && (
                                <div className="p-3 rounded-lg bg-accent/5 border border-accent/20">
                                  <p className="text-[10px] uppercase font-bold text-accent tracking-widest mb-1 flex items-center gap-1">
                                    <FileText className="h-3 w-3" /> {t("patient.dashboard.doctorNotes", "Catatan Dokter")}
                                  </p>
                                  <p className="text-xs text-muted-foreground italic leading-relaxed">"{pres.notes}"</p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-10 flex flex-col items-center border rounded-xl bg-muted/30">
                        <Pill className="h-10 w-10 text-muted-foreground/30 mb-3" />
                        <p className="text-muted-foreground text-sm font-medium">{t("patient.dashboard.noPrescriptions", "Belum ada resep obat")}</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
