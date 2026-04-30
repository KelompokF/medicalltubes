import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { authService } from "@/services/api";
import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Search,
  MessageSquare,
  History,
  Home,
  AlertTriangle,
  User,
  Bell,
  ChevronDown,
  Menu,
  X,
  LogOut,
  Settings,
  Heart,
  FileText // ✅ TAMBAHAN
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

// ✅ UPDATED NAV MENU
const patientNav = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "Search Doctor", path: "/search-doctor", icon: Search },
  { label: "Chat", path: "/chat", icon: MessageSquare },
  { label: "Chat History", path: "/chat-history", icon: History },

  // 🔥 NEW FEATURE
  { label: "Health Records", path: "/health-records", icon: FileText },

  { label: "Home Visit", path: "/home-visit", icon: Home },
  { label: "Home Visit History", path: "/home-visit-history", icon: History },
  { label: "Tracking", path: "/tracking", icon: Home },
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
  // fetch current user to show name in header
  const { data: meData } = useQuery({ queryKey: ["me"], queryFn: () => authService.getMe().then((res) => res.data), staleTime: 1000 * 60 * 5 });
  if (meData) {
    userName = meData.full_name || userName;
    const parts = (meData.full_name || "").split(" ").filter(Boolean);
    userInitials = parts.length ? parts.map(p => p[0]).slice(0,2).join("") : userInitials;
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
            setNotifications(prev => [
              {
                id: Date.now(),
                title: "Pesan Baru",
                description: data.content,
                sender_id: data.sender_id,
                time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
              },
              ...prev
            ]);

            if (!location.pathname.includes("/chat")) {
              toast("Pesan Baru dari Dokter", {
                description: data.content,
                action: {
                  label: "Lihat Chat",
                  onClick: () => navigate("/chat")
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
    <div className="min-h-screen bg-background">

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-sidebar text-sidebar-foreground transform transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
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

        {/* Menu */}
        <nav className="px-3 py-4 space-y-1 overflow-y-auto h-[calc(100%-140px)]">
          <p className="px-3 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50 mb-2">
            Patient Menu
          </p>

          {patientNav.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                isActive(item.path)
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Logout */}
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

      {/* Main Content */}
      <div className="lg:ml-64">

        {/* Header */}
        <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-md border-b">
          <div className="flex items-center justify-between px-4 sm:px-6 py-3">

            {/* Left */}
            <div className="flex items-center gap-3">
              <button
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </button>

              <nav className="hidden sm:flex items-center text-sm text-muted-foreground">
                <Link to="/dashboard" className="hover:text-foreground">
                  Home
                </Link>
                <span className="mx-2">/</span>
                <span className="text-foreground font-medium capitalize">
                  {location.pathname.slice(1).replace(/-/g, " ") || "Dashboard"}
                </span>
              </nav>
            </div>

            {/* Right */}
            <div className="flex items-center gap-2">

              {/* Notification */}
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
                    <span>Notifications</span>
                    {notifications.length > 0 && (
                      <Button variant="ghost" size="sm" className="h-auto p-0 text-[10px] text-primary" onClick={() => setNotifications([])}>Clear all</Button>
                    )}
                  </div>
                  <DropdownMenuSeparator />
                  {notifications.length === 0 ? (
                    <div className="px-3 py-4 text-center text-xs text-muted-foreground">
                      No new notifications
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <DropdownMenuItem key={n.id} className="flex flex-col items-start gap-1 p-3 cursor-pointer" onClick={() => navigate("/chat")}>
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
                      <DropdownMenuItem className="text-xs">Appointment reminder for tomorrow</DropdownMenuItem>
                      <DropdownMenuItem className="text-xs">Prescription updated</DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* User */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center">
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

        {/* Page Content */}
        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="border-t px-6 py-4 text-center text-sm text-muted-foreground">
          © 2026 Medicall — Healthcare Platform
        </footer>
      </div>
    </div>
  );
}