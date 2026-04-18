import { useState } from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import {
  LayoutDashboard, Search, MessageSquare, History, Home, AlertTriangle,
  User, Bell, ChevronDown, Menu, X, LogOut, Settings, Heart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

const patientNav = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "Search Doctor", path: "/search-doctor", icon: Search },
  { label: "Chat", path: "/chat", icon: MessageSquare },
  { label: "Chat History", path: "/chat-history", icon: History },
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

export default function PatientLayout({ userName = "John Doe", userInitials = "JD" }: PatientLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-background">
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <aside className={`fixed top-0 left-0 z-50 h-full w-64 bg-sidebar text-sidebar-foreground transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center gap-2 px-6 py-5 border-b border-sidebar-border">
          <div className="rounded-lg medical-gradient p-2">
            <Heart className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-sidebar-foreground">Medicall</span>
          <button className="ml-auto lg:hidden text-sidebar-foreground" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="px-3 py-4 space-y-1 overflow-y-auto h-[calc(100%-140px)]">
          <p className="px-3 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50 mb-2">Patient Menu</p>
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
                <Link to="/dashboard" className="hover:text-foreground transition-colors">Home</Link>
                <span className="mx-2">/</span>
                <span className="text-foreground font-medium capitalize">{location.pathname.slice(1).replace(/-/g, " ") || "Dashboard"}</span>
              </nav>
            </div>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-emergency text-[10px] font-bold text-emergency-foreground flex items-center justify-center">3</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72">
                  <div className="px-3 py-2 font-semibold text-sm">Notifications</div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>New consultation request</DropdownMenuItem>
                  <DropdownMenuItem>Appointment reminder for tomorrow</DropdownMenuItem>
                  <DropdownMenuItem>Prescription updated</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2">
                    <div className="h-8 w-8 rounded-full medical-gradient flex items-center justify-center text-primary-foreground text-sm font-bold">{userInitials}</div>
                    <span className="hidden sm:inline text-sm font-medium">{userName}</span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild><Link to="/profile">Profile</Link></DropdownMenuItem>
                  <DropdownMenuItem><Settings className="h-4 w-4 mr-2" />Settings</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild><Link to="/login">Logout</Link></DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>
        <main className="p-4 sm:p-6 lg:p-8"><Outlet /></main>
        <footer className="border-t px-6 py-4 text-center text-sm text-muted-foreground">© 2026 Medicall — Healthcare for Everyone. SDG 3: Good Health and Well-being.</footer>
      </div>
    </div>
  );
}
