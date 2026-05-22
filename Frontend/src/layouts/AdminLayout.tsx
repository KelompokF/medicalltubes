import { useState, useEffect, useRef } from "react";
import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, Stethoscope, AlertTriangle, MessageSquare,
  BarChart3, Settings, Bell, ChevronDown, Menu, X, LogOut, Shield, Heart, FileWarning
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

const adminNav = [
  { label: "Dashboard", path: "/admin", icon: LayoutDashboard },
  { label: "Emergency Monitor", path: "/admin/emergencies", icon: AlertTriangle },
  { label: "Consultations", path: "/admin/consultations", icon: MessageSquare },
  { label: "Reports", path: "/admin/reports", icon: FileWarning },
  { label: "Settings", path: "/admin/settings", icon: Settings },
];

interface AdminNotification {
  id: number;
  title: string;
  description: string;
  type: string;
  time: string;
  report_id?: string;
}

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const location = useLocation();
  const navigate = useNavigate();
  const wsRef = useRef<WebSocket | null>(null);
  const isActive = (path: string) => location.pathname === path;

  const user =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user") || "null")
      : null;
  const adminId = user?.id || user?.sub || null;

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  // WebSocket for real-time admin notifications
  useEffect(() => {
    if (!adminId) return;

    const connectWS = () => {
      const port =
        window.location.hostname === "localhost"
          ? "8001"
          : window.location.port;
      const wsUrl = `${
        window.location.protocol === "https:" ? "wss" : "ws"
      }://${window.location.hostname}:${port}/ws/chat/${adminId}`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "new_report") {
            const reportData = data.report;
            const notif: AdminNotification = {
              id: Date.now(),
              title: "Laporan Baru",
              description: data.message || `Laporan dari ${reportData?.reporter_name}`,
              type: "new_report",
              time: new Date().toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
              }),
              report_id: reportData?.id,
            };
            setNotifications((prev) => [notif, ...prev]);
            toast("📢 Laporan Baru Masuk", {
              description: notif.description,
              action: {
                label: "Lihat",
                onClick: () => navigate("/admin/reports"),
              },
            });
            // Inject new report directly to AdminReportsPage if active
            if (reportData) {
              window.dispatchEvent(
                new CustomEvent("new_report_data", { detail: reportData })
              );
            }
          }

          if (data.type === "report_message") {
            const notif: AdminNotification = {
              id: Date.now(),
              title: "Pesan Report",
              description: `${data.sender_name}: ${data.content}`,
              type: "report_message",
              time: new Date().toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
              }),
              report_id: data.report_id,
            };
            setNotifications((prev) => [notif, ...prev]);
            // Only show toast if not on reports page
            if (!location.pathname.includes("/admin/reports")) {
              toast("💬 Pesan Report Baru", {
                description: notif.description,
                action: {
                  label: "Lihat",
                  onClick: () => navigate("/admin/reports"),
                },
              });
            }
          }
        } catch (e) {
          console.error("Admin WS error", e);
        }
      };

      ws.onclose = () => {
        console.log("Admin WS closed, reconnecting...");
        setTimeout(connectWS, 3000);
      };
    };

    connectWS();
    return () => {
      wsRef.current?.close();
    };
  }, [adminId, location.pathname, navigate]);

  const clearNotifications = () => setNotifications([]);

  return (
    <div className="min-h-screen bg-background">
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <aside className={`fixed top-0 left-0 z-50 h-full w-64 bg-sidebar text-sidebar-foreground transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center gap-2 px-6 py-5 border-b border-sidebar-border">
          <div className="rounded-lg bg-emergency p-2">
            <Shield className="h-5 w-5 text-emergency-foreground" />
          </div>
          <div>
            <span className="text-xl font-bold text-sidebar-foreground">Medicall</span>
            <p className="text-[10px] uppercase tracking-widest text-sidebar-foreground/50">Admin Panel</p>
          </div>
          <button className="ml-auto lg:hidden text-sidebar-foreground" onClick={() => setSidebarOpen(false)}><X className="h-5 w-5" /></button>
        </div>

        <nav className="px-3 py-4 space-y-1 overflow-y-auto h-[calc(100%-140px)]">
          <p className="px-3 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50 mb-2">Administration</p>
          {adminNav.map((item) => (
            <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive(item.path) ? "bg-sidebar-primary text-sidebar-primary-foreground" : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}>
              <item.icon className="h-4 w-4" />{item.label}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-sidebar-border">
          <button onClick={handleLogout} className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent transition-colors">
            <LogOut className="h-4 w-4" />Logout
          </button>
        </div>
      </aside>

      <div className="lg:ml-64">
        <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-md border-b">
          <div className="flex items-center justify-between px-4 sm:px-6 py-3">
            <div className="flex items-center gap-3">
              <button className="lg:hidden text-foreground" onClick={() => setSidebarOpen(true)}><Menu className="h-5 w-5" /></button>
              <nav className="hidden sm:flex items-center text-sm text-muted-foreground">
                <Link to="/admin" className="hover:text-foreground transition-colors">Admin</Link>
                <span className="mx-2">/</span>
                <span className="text-foreground font-medium capitalize">{location.pathname.replace("/admin", "").slice(1).replace(/-/g, " ") || "Dashboard"}</span>
              </nav>
            </div>
            <div className="flex items-center gap-2">
              {/* Notification Bell — real-time */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {notifications.length > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-emergency text-[10px] font-bold text-emergency-foreground flex items-center justify-center animate-pulse">
                        {notifications.length > 9 ? "9+" : notifications.length}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <div className="flex items-center justify-between px-3 py-2">
                    <span className="font-semibold text-sm">Notifications</span>
                    {notifications.length > 0 && (
                      <button
                        onClick={clearNotifications}
                        className="text-xs text-primary hover:underline"
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                  <DropdownMenuSeparator />
                  {notifications.length === 0 ? (
                    <div className="px-3 py-6 text-center">
                      <Bell className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">
                        Tidak ada notifikasi baru
                      </p>
                    </div>
                  ) : (
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.slice(0, 20).map((n) => (
                        <DropdownMenuItem
                          key={n.id}
                          className="flex flex-col items-start gap-1 px-3 py-3 cursor-pointer"
                          onClick={() => navigate("/admin/reports")}
                        >
                          <div className="flex items-center gap-2 w-full">
                            <span className={`h-2 w-2 rounded-full shrink-0 ${
                              n.type === "new_report" ? "bg-amber-500" : "bg-blue-500"
                            }`} />
                            <span className="font-medium text-xs text-foreground flex-1 truncate">
                              {n.title}
                            </span>
                            <span className="text-[10px] text-muted-foreground shrink-0">
                              {n.time}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground pl-4 line-clamp-2">
                            {n.description}
                          </p>
                        </DropdownMenuItem>
                      ))}
                    </div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Profile dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2">
                    <div className="h-8 w-8 rounded-full bg-emergency flex items-center justify-center text-emergency-foreground text-sm font-bold">AD</div>
                    <span className="hidden sm:inline text-sm font-medium">Admin</span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem><Settings className="h-4 w-4 mr-2" />Settings</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>
        <main className="p-4 sm:p-6 lg:p-8"><Outlet /></main>
        <footer className="border-t px-6 py-4 text-center text-sm text-muted-foreground">© 2026 Medicall Admin Panel — Healthcare Management System</footer>
      </div>
    </div>
  );
}
