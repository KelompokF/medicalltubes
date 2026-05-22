import { useState, useEffect, useRef } from "react";
import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, AlertTriangle, MapPin, History, Truck,
  Settings, Bell, ChevronDown, Menu, X, LogOut, Ambulance, FileWarning
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import api from "@/services/api";

const ambulanceNav = [
  { label: "Dashboard", path: "/ambulance-dashboard", icon: LayoutDashboard },
  { label: "Active Emergencies", path: "/ambulance-dashboard/active", icon: AlertTriangle },
  { label: "Live Tracking", path: "/ambulance-dashboard/tracking", icon: MapPin },
  { label: "Fleet Status", path: "/ambulance-dashboard/fleet", icon: Truck },
  { label: "Emergency History", path: "/ambulance-dashboard/history", icon: History },
  { label: "Report Tracking", path: "/ambulance-dashboard/report-tracking", icon: FileWarning },
  { label: "Settings", path: "/ambulance-dashboard/settings", icon: Settings },
];

export default function AmbulanceLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const [userName, setUserName] = useState("Unit 1");
  const [userInitials, setUserInitials] = useState("U1");

  useEffect(() => {
    try {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user && user.full_name) {
          setUserName(user.full_name);
          const parts = user.full_name.split(" ").filter(Boolean);
          setUserInitials(parts.length ? parts.map((p: string) => p[0].toUpperCase()).slice(0, 2).join("") : "U1");
        }
      }
    } catch (e) {
      console.error("Failed to parse user from localStorage", e);
    }
  }, []);

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setNotificationOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = (path: string) => location.pathname === path;

  const knownEmergencyIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    let isMounted = true;
    let isInitialLoad = true;

    const fetchEmergencies = async () => {
      try {
        const res = await api.get("/emergencies/active");
        if (!isMounted) return;

        if (res.data && Array.isArray(res.data.data)) {
          const activeEmergencies = res.data.data;
          const currentActiveIds = new Set(activeEmergencies.map((e: any) => String(e.id)));

          // Remove toast if emergency is no longer active (cancelled/completed)
          knownEmergencyIds.current.forEach(knownId => {
            if (!currentActiveIds.has(String(knownId))) {
              toast.dismiss(`emergency-${knownId}`);
              knownEmergencyIds.current.delete(knownId);
            }
          });

          activeEmergencies.forEach((emergency: any) => {
            const emergencyIdStr = String(emergency.id);
            if (!knownEmergencyIds.current.has(emergencyIdStr)) {
              knownEmergencyIds.current.add(emergencyIdStr);

              if (!isInitialLoad) {

                toast.error("🚨 Darurat Medis!", {
                  id: `emergency-${emergencyIdStr}`,
                  description: (
                    <div className="!text-gray-700 flex flex-col gap-0.5 mt-0.5" data-testid={`emergency-toast-content-${emergencyIdStr}`}>
                      <span className="font-semibold text-red-700">Waktu: {new Date(emergency.created_at.endsWith("Z") ? emergency.created_at : emergency.created_at + "Z").toLocaleString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                      <span>Lokasi: {emergency.location_address || "Tidak diketahui"} ({emergency.distance_km} km)</span>
                    </div>
                  ),
                  className:
                    "!bg-white !text-red-600 animate-[pulse_1s_ease-in-out_infinite] !border-2 !border-red-600 shadow-[0_0_20px_rgba(220,38,38,0.8)]",

                  action: {
                    label: "Lihat",
                    onClick: () => navigate("/ambulance-dashboard/active"),
                  },

                  actionButtonStyle: {
                    backgroundColor: "#dc2626",
                    color: "#ffffff",
                  },

                  duration: Number.POSITIVE_INFINITY,
                });
              }
            }
          });

          isInitialLoad = false;

          setNotifications(activeEmergencies.map((e: any) => ({
            id: e.id,
            title: `🚨 Emergency: ${e.type === 'general' ? 'Umum' : e.type}`,
            description: `${e.location_address || 'Lokasi tidak diketahui'} - ${e.distance_km} km`,
            time: new Date(e.created_at.endsWith("Z") ? e.created_at : e.created_at + "Z").toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }),
            status: e.status
          })));
        }
      } catch (error) {
        console.error("Failed to fetch active emergencies:", error);
      }
    };

    fetchEmergencies();
    const interval = setInterval(fetchEmergencies, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background">
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <aside className={`fixed top-0 left-0 z-50 h-full w-64 bg-sidebar text-sidebar-foreground transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center gap-2 px-6 py-5 border-b border-sidebar-border">
          <div className="rounded-lg bg-warning p-2">
            <Ambulance className="h-5 w-5 text-warning-foreground" />
          </div>
          <div>
            <span className="text-xl font-bold text-sidebar-foreground">Medicall</span>
            <p className="text-[10px] uppercase tracking-widest text-sidebar-foreground/50">Ambulance Unit</p>
          </div>
          <button className="ml-auto lg:hidden text-sidebar-foreground" onClick={() => setSidebarOpen(false)}><X className="h-5 w-5" /></button>
        </div>

        <nav className="px-3 py-4 space-y-1 overflow-y-auto h-[calc(100%-140px)]">
          <p className="px-3 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50 mb-2">Ambulance Menu</p>
          {ambulanceNav.map((item) => (
            <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${isActive(item.path) ? "bg-sidebar-primary text-sidebar-primary-foreground" : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}>
              <item.icon className="h-4 w-4" />{item.label}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-sidebar-border">
          <Link to="/login" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent transition-colors">
            <LogOut className="h-4 w-4" />Logout
          </Link>
        </div>
      </aside>

      <div className="lg:ml-64">
        <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-md border-b">
          <div className="flex items-center justify-between px-4 sm:px-6 py-3">
            <div className="flex items-center gap-3">
              <button className="lg:hidden text-foreground" onClick={() => setSidebarOpen(true)}><Menu className="h-5 w-5" /></button>
              <nav className="hidden sm:flex items-center text-sm text-muted-foreground">
                <Link to="/ambulance-dashboard" className="hover:text-foreground transition-colors">Ambulance</Link>
                <span className="mx-2">/</span>
                <span className="text-foreground font-medium capitalize">{location.pathname.replace("/ambulance-dashboard", "").slice(1).replace(/-/g, " ") || "Dashboard"}</span>
              </nav>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative" ref={notificationRef}>
                <Button 
                  id="btn-notification-bell" 
                  name="btn-notification-bell"
                  variant="ghost" 
                  size="icon" 
                  className="relative" 
                  data-testid="notification-bell"
                  onClick={() => setNotificationOpen(!notificationOpen)}
                >
                  <Bell className={`h-5 w-5 pointer-events-none ${notifications.length > 0 ? "text-red-600 animate-pulse" : ""}`} />
                  {notifications.length > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-emergency text-[10px] font-bold text-emergency-foreground flex items-center justify-center animate-pulse pointer-events-none" data-testid="notification-badge">
                      {notifications.length}
                    </span>
                  )}
                </Button>

                {notificationOpen && (
                  <div className="absolute right-0 mt-2 w-72 rounded-md border bg-popover text-popover-foreground shadow-md outline-none z-50 animate-in fade-in-0 zoom-in-95" data-testid="notification-dropdown-content">
                    <div className="px-3 py-2 font-semibold text-sm flex justify-between items-center border-b">
                      <span>Emergency Alerts</span>
                      {notifications.length > 0 && (
                        <Button name="btn-clear-notifications" variant="ghost" size="sm" className="h-auto p-0 text-[10px] text-primary" onClick={() => setNotifications([])} data-testid="notification-clear-all">Clear all</Button>
                      )}
                    </div>
                    
                    <div className="max-h-[300px] overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="px-3 py-4 text-center text-xs text-muted-foreground">
                          No active emergency alerts
                        </div>
                      ) : (
                        notifications.map((n, index) => (
                          <button 
                            type="button"
                            key={n.id} 
                            className="flex flex-col items-start gap-1 p-3 cursor-pointer text-emergency w-full text-left hover:bg-accent hover:text-accent-foreground transition-colors border-b last:border-b-0 bg-transparent" 
                            onClick={() => {
                              setNotificationOpen(false);
                              navigate("/ambulance-dashboard/active");
                            }} 
                            data-testid={`notification-item-${index}`} 
                            id={`notification-item-${index}`}
                          >
                            <div className="flex justify-between w-full pointer-events-none">
                              <span className="font-semibold text-xs">{n.title}</span>
                              <span className="text-[10px] text-muted-foreground">{n.time}</span>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2 pointer-events-none">{n.description}</p>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2">
                    <div className="h-8 w-8 rounded-full bg-warning flex items-center justify-center text-warning-foreground text-sm font-bold">{userInitials}</div>
                    <span className="hidden sm:inline text-sm font-medium">{userName}</span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem><Settings className="h-4 w-4 mr-2" />Settings</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild><Link to="/login">Logout</Link></DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>
        <main className="p-4 sm:p-6 lg:p-8"><Outlet /></main>
        <footer className="border-t px-6 py-4 text-center text-sm text-muted-foreground">© 2026 Medicall Emergency Services — Rapid Response Unit</footer>
      </div>
    </div>
  );
}
