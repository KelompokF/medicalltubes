import { useState, useEffect, useRef } from "react";
import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard, Users, Calendar, Pill, MessageSquare,
  ClipboardList, Settings, Bell, ChevronDown, Menu, X, LogOut, Stethoscope, Home, FileWarning
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import api from "@/services/api";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import medicallIcon from "@/assets/medicall-icon.png";

interface Notification {
  id: number;
  title: string;
  description: string;
  sender_id: string;
  room_id?: string;
  time: string;
}

export default function DoctorLayout() {
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = (path: string) => location.pathname === path;

  const doctorNav = [
    { label: t("doctor.layout.dashboard"), path: "/doctor-dashboard", icon: LayoutDashboard },
    { label: t("doctor.layout.myPatients"), path: "/doctor-dashboard/patients", icon: Users },
    { label: t("doctor.layout.consultations"), path: "/doctor-dashboard/consultations", icon: MessageSquare },
    { label: t("doctor.layout.homeVisits"), path: "/doctor-dashboard/home-visits", icon: Home },
    { label: t("doctor.layout.schedule"), path: "/doctor-dashboard/schedule", icon: Calendar },
    { label: t("doctor.layout.prescriptions"), path: "/doctor-dashboard/prescriptions", icon: Pill },
    { label: t("doctor.layout.medicalRecords"), path: "/doctor-dashboard/records", icon: ClipboardList },
    { label: t("doctor.layout.reportTracking"), path: "/doctor-dashboard/report-tracking", icon: FileWarning },
    { label: t("doctor.layout.settings"), path: "/doctor-dashboard/settings", icon: Settings },
  ];

  // Get current user
  const user = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "null") : null;
  const doctorId = user?.id || user?.sub || null;
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!doctorId) return;

    let isMounted = true;
    
    // Fetch initial unread messages
    api.get("/chat/rooms").then((res) => {
      if (isMounted && Array.isArray(res.data)) {
        const unreadNotifications = res.data
          .filter((room: any) => room.unread_count > 0)
          .map((room: any) => ({
            id: Date.now() + Math.random(),
            title: `Pesan Baru dari ${room.partner_name}`,
            description: `Ada ${room.unread_count} pesan belum dibaca.`,
            sender_id: room.partner_id,
            room_id: room.room_id,
            time: new Date(room.last_date || Date.now()).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
          }));
        
        if (unreadNotifications.length > 0) {
          setNotifications(prev => [...unreadNotifications, ...prev]);
        }
      }
    }).catch(console.error);

    const connectWS = () => {
      if (!isMounted) return;
      
      const port = window.location.hostname === "localhost" ? "8001" : window.location.port;
      const wsUrl = `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.hostname}:${port}/ws/chat/${doctorId}`;
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Only notify if it's a message for me (receiver) and I'm not the sender
          if (data.receiver_id === doctorId && data.sender_id !== doctorId) {
            // Add to notification list
            setNotifications(prev => [
              {
                id: Date.now(),
                title: t("doctor.layout.newMessage"),
                description: data.content,
                sender_id: data.sender_id,
                room_id: data.room_id,
                time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
              },
              ...prev
            ]);

            // Show toast if not on the specific consultation page
            if (!window.location.pathname.includes("/doctor-dashboard/consultations")) {
              toast(t("doctor.layout.newMessageFromPatient"), {
                description: data.content,
                action: {
                  label: t("doctor.layout.viewChat"),
                  onClick: () => navigate(`/doctor-dashboard/consultations?room_id=${data.room_id}`)
                },
              });
            }
          }
        } catch (e) {
          console.error("Error parsing WS message in Layout", e);
        }
      };

      ws.onclose = () => {
        if (isMounted) {
          setTimeout(connectWS, 3000); // Reconnect after 3s
        }
      };
    };

    connectWS();

    return () => {
      isMounted = false;
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [doctorId, navigate, t]);

  return (
    <div className="min-h-screen bg-background">
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <aside className={`fixed top-0 left-0 z-50 h-full w-64 bg-sidebar text-sidebar-foreground transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center gap-2 px-6 py-5 border-b border-sidebar-border">
          <img src={medicallIcon} alt="Medicall Icon" className="h-8 w-auto" />
          <div>
            <span className="text-xl font-bold text-sidebar-foreground">Medicall</span>
            <p className="text-[10px] uppercase tracking-widest text-sidebar-foreground/50">{t("doctor.layout.doctorPortal")}</p>
          </div>
          <button className="ml-auto lg:hidden text-sidebar-foreground" onClick={() => setSidebarOpen(false)}><X className="h-5 w-5" /></button>
        </div>

        <nav className="px-3 py-4 space-y-1 overflow-y-auto h-[calc(100%-140px)]">
          <p className="px-3 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50 mb-2">{t("doctor.layout.doctorMenu")}</p>
          {doctorNav.map((item) => (
            <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive(item.path) ? "bg-sidebar-primary text-sidebar-primary-foreground" : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}>
              <item.icon className="h-4 w-4" />{item.label}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-sidebar-border">
          <Link to="/login" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent transition-colors">
            <LogOut className="h-4 w-4" />{t("common.logout")}
          </Link>
        </div>
      </aside>

      <div className="lg:ml-64 flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-md border-b">
          <div className="flex items-center justify-between px-4 sm:px-6 py-3">
            <div className="flex items-center gap-3">
              <button className="lg:hidden text-foreground" onClick={() => setSidebarOpen(true)}><Menu className="h-5 w-5" /></button>
              <nav className="hidden sm:flex items-center text-sm text-muted-foreground">
                <Link to="/doctor-dashboard" className="hover:text-foreground transition-colors">Doctor</Link>
                <span className="mx-2">/</span>
                <span className="text-foreground font-medium capitalize">{location.pathname.replace("/doctor-dashboard", "").slice(1).replace(/-/g, " ") || t("common.dashboard")}</span>
              </nav>
            </div>
            <div className="flex items-center gap-2">
              <LanguageSwitcher />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {notifications.length > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-emergency text-[10px] font-bold text-emergency-foreground flex items-center justify-center animate-pulse">
                        {notifications.length}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72">
                  <div className="px-3 py-2 font-semibold text-sm flex justify-between items-center">
                    <span>{t("common.notifications")}</span>
                    {notifications.length > 0 && (
                      <Button variant="ghost" size="sm" className="h-auto p-0 text-[10px] text-primary" onClick={() => setNotifications([])}>{t("common.clearAll")}</Button>
                    )}
                  </div>
                  <DropdownMenuSeparator />
                  {notifications.length === 0 ? (
                    <div className="px-3 py-4 text-center text-xs text-muted-foreground">
                      {t("doctor.layout.noNotifications")}
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <DropdownMenuItem key={n.id} className="flex flex-col items-start gap-1 p-3 cursor-pointer" onClick={() => navigate(n.room_id ? `/doctor-dashboard/consultations?room_id=${n.room_id}` : "/doctor-dashboard/consultations")}>
                        <div className="flex justify-between w-full">
                          <span className="font-semibold text-xs">{n.title}</span>
                          <span className="text-[10px] text-muted-foreground">{n.time}</span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">{n.description}</p>
                      </DropdownMenuItem>
                    ))
                  )}
                  {notifications.length === 0 && (
                    <>
                      <DropdownMenuItem className="text-xs">{t("doctor.layout.pendingRequests")}</DropdownMenuItem>
                      <DropdownMenuItem className="text-xs">{t("doctor.layout.homeVisitScheduled")}</DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2">
                    <div className="h-8 w-8 rounded-full bg-success flex items-center justify-center text-success-foreground text-sm font-bold">
                      {typeof window !== "undefined" && JSON.parse(localStorage.getItem("user") || "null")?.full_name 
                        ? JSON.parse(localStorage.getItem("user") || "null").full_name.split(" ").filter((n: string) => n.length > 1 && !n.includes(".") && !n.includes(",")).map((n: string) => n[0]).join("").slice(0, 2) 
                        : "DR"}
                    </div>
                    <span className="hidden sm:inline text-sm font-medium">
                      {typeof window !== "undefined" && JSON.parse(localStorage.getItem("user") || "null")?.full_name 
                        ? JSON.parse(localStorage.getItem("user") || "null").full_name 
                        : "Doctor"}
                    </span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem><Settings className="h-4 w-4 mr-2" />{t("common.settings")}</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild><Link to="/login">{t("common.logout")}</Link></DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>
        <main className="p-4 sm:p-6 lg:p-8 flex-1"><Outlet /></main>
        <footer className="border-t px-6 py-4 text-center text-sm text-muted-foreground">{t("doctor.layout.footer")}</footer>
      </div>
    </div>
  );
}
