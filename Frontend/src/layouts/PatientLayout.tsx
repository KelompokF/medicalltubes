import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { authService, userService, patientService } from "@/services/api";
import { Link, useLocation, Outlet } from "react-router-dom";
import {
  LayoutDashboard, Search, MessageSquare, History, Home, AlertTriangle,
  User, Bell, ChevronDown, Menu, X, LogOut, Settings, Heart, Accessibility, Moon, Sun, Type, Palette
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

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

  // Accessibility state
  const [contrastMode, setContrastMode] = useState("normal");
  const [largeText, setLargeText] = useState(false);
  const [colorBlind, setColorBlind] = useState(false);

  // fetch current user to show name in header
  const { data: meData } = useQuery({ queryKey: ["me"], queryFn: () => authService.getMe().then((res) => res.data), staleTime: 1000 * 60 * 5 });
  if (meData) {
    userName = meData.full_name || userName;
    const parts = (meData.full_name || "").split(" ").filter(Boolean);
    userInitials = parts.length ? parts.map(p => p[0]).slice(0, 2).join("") : userInitials;
  }

  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  useEffect(() => {
    if (meData) {
      setContrastMode(meData.contrast_mode || (meData.high_contrast_enabled ? "dark" : "normal"));
      setLargeText(!!meData.large_text_enabled);
      setColorBlind(!!meData.color_blind_enabled);
    }
  }, [meData]);

  useEffect(() => {
    // Remove all contrast classes first
    document.documentElement.classList.remove("contrast-dark", "contrast-light", "contrast-blue", "contrast-yellow", "high-contrast");
    
    if (contrastMode !== "normal") {
      document.documentElement.classList.add(`contrast-${contrastMode}`);
      // Remove dark mode when high contrast is active to avoid conflicts
      document.documentElement.classList.remove("dark");
    }

    if (largeText) document.documentElement.classList.add("large-text");
    else document.documentElement.classList.remove("large-text");

    if (colorBlind) document.documentElement.classList.add("color-blind");
    else document.documentElement.classList.remove("color-blind");
  }, [contrastMode, largeText, colorBlind]);

  const updateContrastMode = async (mode: string) => {
    setContrastMode(mode);
    try {
      await userService.updateAccessibility({ 
        contrast_mode: mode,
        high_contrast_enabled: mode !== "normal" 
      });
    } catch (e) {
      console.error(e);
    }
  };

  const toggleLargeText = async (val: boolean) => {
    setLargeText(val);
    try {
      await userService.updateAccessibility({ large_text_enabled: val });
    } catch (e) {
      console.error(e);
    }
  };

  const toggleColorBlind = async (val: boolean) => {
    setColorBlind(val);
    try {
      await userService.updateAccessibility({ color_blind_enabled: val });
    } catch (e) {
      console.error(e);
    }
  };

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

      {/* Floating Accessibility Menu */}
      <div className="fixed bottom-6 right-6 z-50">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="default" size="icon" className="h-14 w-14 rounded-full shadow-elevated bg-primary text-primary-foreground hover:bg-primary/90">
              <Accessibility className="h-7 w-7" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-80 mb-2 p-2 rounded-xl shadow-elevated border-primary/20">
            <div className="px-3 py-2 font-bold text-base text-primary">Pengaturan Aksesibilitas</div>
            <DropdownMenuSeparator className="bg-primary/10" />
            <div className="grid grid-cols-2 gap-2 px-2 py-2">
              <Button
                variant={contrastMode === "dark" ? "default" : "outline"}
                className={`flex flex-col items-center justify-center h-20 gap-1 transition-all ${contrastMode === "dark" ? 'shadow-md border-2 border-primary bg-primary text-primary-foreground' : 'opacity-90 border-2'}`}
                onClick={() => updateContrastMode("dark")}
              >
                <Moon className="h-5 w-5" />
                <span className="text-[10px] font-bold text-center">Gelap</span>
              </Button>
              <Button
                variant={contrastMode === "light" ? "default" : "outline"}
                className={`flex flex-col items-center justify-center h-20 gap-1 transition-all ${contrastMode === "light" ? 'shadow-md border-2 border-primary bg-primary text-primary-foreground' : 'opacity-90 border-2'}`}
                onClick={() => updateContrastMode("light")}
              >
                <Sun className="h-5 w-5" />
                <span className="text-[10px] font-bold text-center">Terang</span>
              </Button>
              <Button
                variant={contrastMode === "yellow" ? "default" : "outline"}
                className={`flex flex-col items-center justify-center h-20 gap-1 transition-all ${contrastMode === "yellow" ? 'shadow-md border-2 border-primary bg-primary text-primary-foreground' : 'opacity-90 border-2'}`}
                onClick={() => updateContrastMode("yellow")}
              >
                <Palette className={`h-5 w-5 ${contrastMode === "normal" ? 'text-yellow-500' : ''}`} />
                <span className="text-[10px] font-bold text-center">Kuning</span>
              </Button>
              <Button
                variant={contrastMode === "normal" ? "default" : "outline"}
                className={`flex flex-col items-center justify-center h-20 gap-1 transition-all ${contrastMode === "normal" ? 'shadow-md border-primary ring-2 ring-primary/20' : 'opacity-90 border-2'}`}
                onClick={() => updateContrastMode("normal")}
              >
                <Sun className={`h-5 w-5 ${contrastMode === "normal" ? '' : 'text-blue-400'}`} />
                <span className="text-[10px] font-bold text-center">Normal</span>
              </Button>
            </div>
            <DropdownMenuSeparator className="bg-primary/10" />
            <div className="grid grid-cols-2 gap-2 px-2 py-2">
              <Button
                variant={colorBlind ? "default" : "outline"}
                className={`flex flex-col items-center justify-center h-20 gap-1 transition-all ${colorBlind ? 'shadow-md border-2 border-primary bg-primary text-primary-foreground' : 'opacity-90 border-2'}`}
                onClick={() => toggleColorBlind(!colorBlind)}
              >
                <Palette className="h-5 w-5" />
                <span className="text-[10px] font-bold text-center">Buta Warna</span>
              </Button>
              <Button
                variant={largeText ? "default" : "outline"}
                className={`flex flex-col items-center justify-center h-20 gap-1 transition-all ${largeText ? 'shadow-md border-2 border-primary bg-primary text-primary-foreground' : 'opacity-90 border-2'}`}
                onClick={() => toggleLargeText(!largeText)}
              >
                <Type className="h-5 w-5" />
                <span className="text-[10px] font-bold text-center">Teks Besar</span>
              </Button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
