import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { authService } from "@/services/api";
import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Search, MessageSquare, History, Home,
  AlertTriangle, User, Bell, ChevronDown, Menu, X,
  LogOut, Settings, Heart, ClipboardList
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { AccessibilityProvider } from "@/contexts/AccessibilityContext";
import AccessibilityPanel from "@/components/AccessibilityPanel";

const patientNav = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "Search Doctor", path: "/search-doctor", icon: Search },
  { label: "Chat", path: "/chat", icon: MessageSquare },
  { label: "Chat History", path: "/chat-history", icon: History },
  { label: "Home Visit", path: "/home-visit", icon: Home },
  { label: "Home Visit History", path: "/home-visit-history", icon: History },
  { label: "Home Visit Tracking", path: "/tracking", icon: Home },
  { label: "Medical Records", path: "/health-records", icon: ClipboardList },
  { label: "Emergency", path: "/emergency", icon: AlertTriangle },
  { label: "Profile", path: "/profile", icon: User },
];

interface PatientLayoutProps {
  userName?: string;
  userInitials?: string;
}

export default function PatientLayout({
  userName = "John Doe",
  userInitials = "JD"
}: PatientLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: meData } = useQuery({
    queryKey: ["me"],
    queryFn: () => authService.getMe().then((res) => res.data),
    staleTime: 1000 * 60 * 5,
  });

  if (meData) {
    userName = meData.full_name || userName;
    const parts = (meData.full_name || "").split(" ").filter(Boolean);
    userInitials = parts.length ? parts.map(p => p[0]).slice(0, 2).join("") : userInitials;
  }

  const [notifications, setNotifications] = useState<any[]>([]);
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => location.pathname === path;

  // WebSocket for notifications
  const userId = meData?.id || JSON.parse(localStorage.getItem("user") || "{}")?.id;
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!userId) return;

    const connectWS = () => {
      const port = window.location.hostname === "localhost" ? "8001" : window.location.port;
      const wsUrl = `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.hostname}:${port}/ws/chat/${userId}`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.receiver_id === userId && data.sender_id !== userId) {
            setNotifications((prev) => [
              {
                id: Date.now(),
                title: "Pesan Baru",
                description: data.content,
                sender_id: data.sender_id,
                room_id: data.room_id,
                time: new Date().toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
              },
              ...prev,
            ]);

            if (!location.pathname.includes("/chat")) {
              toast("Pesan Baru dari Dokter", {
                description: data.content,
                action: {
                  label: "Lihat Chat",
                  onClick: () => navigate("/chat"),
                },
              });
            }
          }
        } catch (e) {
          console.error("WS notification error", e);
        }
      };

      ws.onclose = () => setTimeout(connectWS, 3000);
    };

    connectWS();
    return () => wsRef.current?.close();
  }, [userId, location.pathname, navigate]);


  return (
    <AccessibilityProvider>
      <div className="patient-shell min-h-screen bg-background">

      {/* overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-sidebar text-sidebar-foreground transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <div className="flex items-center gap-2 px-6 py-5 border-b border-sidebar-border">
          <div className="rounded-lg medical-gradient p-2">
            <Heart className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold">Medicall</span>

          <button
            className="ml-auto lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="px-3 py-4 space-y-1 overflow-y-auto h-[calc(100%-140px)]">
          <p className="px-3 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50 mb-2">
            Patient Menu
          </p>

          {patientNav.map((item) => (
            <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive(item.path) ? "bg-sidebar-primary text-sidebar-primary-foreground" : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}>
              <item.icon className="h-4 w-4" />{item.label}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-sidebar-border">
          <Link
            to="/login"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Link>
        </div>
      </aside>

      {/* MAIN */}
      <div className="lg:ml-64">

        {/* HEADER */}
        <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-md border-b">
          <div className="flex items-center justify-between px-4 sm:px-6 py-3">

            <button
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* breadcrumb */}
            <nav className="hidden sm:flex items-center text-sm text-muted-foreground">
              <Link to="/dashboard">Home</Link>
              <span className="mx-2">/</span>
              <span className="text-foreground font-medium capitalize">
                {location.pathname.slice(1).replace(/-/g, " ") || "Dashboard"}
              </span>
            </nav>

            <div className="flex items-center gap-3">

              {/* notif */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {notifications.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full px-1">
                        {notifications.length}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-72">
                  <div className="px-3 py-2 font-semibold text-sm">
                    Notifications
                  </div>
                  <DropdownMenuSeparator />

                  {notifications.length === 0 ? (
                    <div className="px-3 py-4 text-xs text-muted-foreground">
                      No new notifications
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <DropdownMenuItem
                        key={n.id}
                        onClick={() => navigate("/chat")}
                      >
                        {n.description}
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* profile */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold">
                      {userInitials}
                    </div>
                    <span className="hidden sm:inline">{userName}</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to="/profile">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/login">Logout</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

            </div>
          </div>
        </header>

        {/* CONTENT */}
        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>

        <footer className="border-t px-6 py-4 text-center text-sm text-muted-foreground">
          © 2026 Medicall — Healthcare Platform
        </footer>

      </div>
    </div>
      <AccessibilityPanel />
    </AccessibilityProvider>
  );
}