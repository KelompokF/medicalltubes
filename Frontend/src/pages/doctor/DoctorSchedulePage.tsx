import { useState, useEffect } from "react";
import { 
  Calendar, 
  Clock, 
  Plus, 
  Trash2, 
  Copy, 
  Save, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  ChevronRight,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  doctorScheduleService, 
  DaySchedule, 
  DoctorScheduleResponse 
} from "@/services/api";
import { cn } from "@/lib/utils";

const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

// Predefined time slots for quick selection
const QUICK_SLOTS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
  "18:30", "19:00", "19:30", "20:00", "20:30", "21:00"
];

export default function DoctorSchedulePage() {
  const [schedule, setSchedule] = useState<DaySchedule[]>(
    DAYS.map(hari => ({ hari, slots: [] }))
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("Senin");
  const [customTime, setCustomTime] = useState("");

  useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    setIsLoading(true);
    try {
      const response = await doctorScheduleService.getMySchedule();
      const backendSchedule = response.data.schedule;
      
      // Merge with default DAYS to ensure all days are present
      const fullSchedule = DAYS.map(hari => {
        const found = backendSchedule.find(s => s.hari === hari);
        return found ? { ...found } : { hari, slots: [] };
      });
      
      setSchedule(fullSchedule);
    } catch (error) {
      console.error("Error fetching schedule:", error);
      toast.error("Gagal memuat jadwal praktik.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSlot = (hari: string, slot: string) => {
    setSchedule(prev => prev.map(day => {
      if (day.hari !== hari) return day;
      
      const exists = day.slots.includes(slot);
      if (exists) {
        return { ...day, slots: day.slots.filter(s => s !== slot) };
      } else {
        return { ...day, slots: [...day.slots, slot].sort() };
      }
    }));
  };

  const handleAddCustomTime = (hari: string) => {
    if (!customTime) return;
    
    // Simple HH:MM validation
    if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(customTime)) {
      toast.error("Format waktu tidak valid (Gunakan HH:MM)");
      return;
    }

    if (schedule.find(d => d.hari === hari)?.slots.includes(customTime)) {
      toast.error("Waktu sudah ada di jadwal.");
      return;
    }

    handleToggleSlot(hari, customTime);
    setCustomTime("");
  };

  const handleCopySchedule = (fromDay: string) => {
    const slotsToCopy = schedule.find(d => d.hari === fromDay)?.slots || [];
    if (slotsToCopy.length === 0) {
      toast.error("Pilih setidaknya satu slot waktu untuk disalin.");
      return;
    }

    setSchedule(prev => prev.map(day => {
      if (day.hari === fromDay) return day;
      return { ...day, slots: [...slotsToCopy] };
    }));
    
    toast.success(`Jadwal ${fromDay} disalin ke semua hari.`);
  };

  const handleClearDay = (hari: string) => {
    setSchedule(prev => prev.map(day => {
      if (day.hari !== hari) return day;
      return { ...day, slots: [] };
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await doctorScheduleService.updateMySchedule(schedule);
      toast.success("Jadwal praktik berhasil disimpan!");
    } catch (error) {
      console.error("Error saving schedule:", error);
      toast.error("Gagal menyimpan jadwal praktik.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 animate-fade-in">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
          <Calendar className="h-6 w-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <p className="text-muted-foreground mt-4 font-medium">Memuat pengaturan jadwal...</p>
      </div>
    );
  }

  const currentDaySchedule = schedule.find(d => d.hari === activeTab);

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-primary mb-1">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Calendar className="h-5 w-5" />
            </div>
            <span className="font-bold tracking-wider uppercase text-xs">Pengaturan Layanan</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Jadwal Praktik</h1>
          <p className="text-slate-500 font-medium max-w-xl leading-relaxed">
            Atur ketersediaan waktu Anda untuk layanan <span className="text-primary font-bold">Kunjungan Rumah (Home Visit)</span>. Pasien hanya dapat memilih waktu yang Anda aktifkan di sini.
          </p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          size="lg"
          className="rounded-2xl px-8 h-14 bg-primary hover:bg-primary/90 text-white font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          {isSaving ? (
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
          ) : (
            <Save className="h-5 w-5 mr-2" />
          )}
          Simpan Jadwal
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar / Tabs Navigation */}
        <div className="lg:col-span-3 space-y-4">
          <Card className="border-0 shadow-md rounded-[2rem] overflow-hidden bg-white">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold">Pilih Hari</CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <div className="flex flex-col gap-1">
                {DAYS.map((hari) => {
                  const daySlots = schedule.find(d => d.hari === hari)?.slots || [];
                  const isActive = activeTab === hari;
                  
                  return (
                    <button
                      key={hari}
                      onClick={() => setActiveTab(hari)}
                      className={cn(
                        "flex items-center justify-between w-full p-4 rounded-2xl transition-all font-bold text-sm",
                        isActive 
                          ? "bg-primary text-white shadow-md shadow-primary/20 scale-[1.02]" 
                          : "hover:bg-slate-50 text-slate-600"
                      )}
                    >
                      <span className="flex items-center gap-3">
                        {hari}
                        {daySlots.length > 0 && !isActive && (
                          <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                        )}
                      </span>
                      <div className={cn(
                        "px-2 py-0.5 rounded-lg text-[10px] uppercase",
                        isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-400"
                      )}>
                        {daySlots.length} Slot
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md rounded-[2rem] overflow-hidden bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100/50">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-100 rounded-lg shrink-0">
                  <Info className="h-4 w-4 text-amber-600" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-amber-800 uppercase">Tips</p>
                  <p className="text-xs text-amber-700/80 leading-relaxed">
                    Gunakan fitur <b>Salin ke Semua</b> jika jadwal praktik Anda sama setiap harinya.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-9 space-y-6">
          <Card className="border-0 shadow-xl rounded-[2.5rem] overflow-hidden bg-white min-h-[500px] flex flex-col">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
                    <Clock className="h-7 w-7" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-black text-slate-900">Hari {activeTab}</CardTitle>
                    <CardDescription className="font-medium text-slate-500">
                      Aktifkan jam kerja Anda untuk hari ini
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="rounded-xl font-bold border-slate-200 text-slate-600 hover:bg-slate-50"
                    onClick={() => handleCopySchedule(activeTab)}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Salin ke Semua Hari
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="rounded-xl font-bold text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => handleClearDay(activeTab)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-8 flex-1">
              <div className="space-y-8">
                {/* Custom Time Input */}
                <div className="flex flex-col sm:flex-row items-end gap-4 max-w-md bg-slate-50 p-6 rounded-3xl border border-slate-100">
                  <div className="flex-1 space-y-2">
                    <label className="text-xs font-black uppercase text-slate-400 ml-1">Tambah Jam Kustom</label>
                    <input
                      type="time"
                      value={customTime}
                      onChange={(e) => setCustomTime(e.target.value)}
                      className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-slate-700"
                    />
                  </div>
                  <Button 
                    onClick={() => handleAddCustomTime(activeTab)}
                    className="h-12 rounded-xl px-6 bg-slate-900 hover:bg-slate-800 text-white font-bold"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Tambah
                  </Button>
                </div>

                {/* Quick Selection Grid */}
                <div className="space-y-4">
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    Slot Waktu Tersedia
                    <div className="h-px flex-1 bg-slate-100" />
                  </h3>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                    {QUICK_SLOTS.map((slot) => {
                      const isSelected = currentDaySchedule?.slots.includes(slot);
                      return (
                        <button
                          key={slot}
                          onClick={() => handleToggleSlot(activeTab, slot)}
                          className={cn(
                            "group relative flex flex-col items-center justify-center py-4 rounded-2xl border-2 transition-all overflow-hidden",
                            isSelected
                              ? "bg-primary/5 border-primary text-primary shadow-sm"
                              : "bg-white border-slate-100 text-slate-600 hover:border-slate-300"
                          )}
                        >
                          <span className="font-bold text-lg">{slot}</span>
                          <span className="text-[10px] uppercase font-black tracking-tighter mt-1 opacity-50 group-hover:opacity-100 transition-opacity">
                            {isSelected ? "Aktif" : "Nonaktif"}
                          </span>
                          
                          {isSelected && (
                            <div className="absolute top-2 right-2">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Selected Slots Summary */}
                {currentDaySchedule?.slots && currentDaySchedule.slots.length > 0 && (
                  <div className="space-y-4 pt-4 border-t border-slate-50">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">
                      Ringkasan Jadwal {activeTab}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {currentDaySchedule.slots.map((slot) => (
                        <Badge 
                          key={slot} 
                          variant="secondary" 
                          className="bg-primary/10 text-primary border border-primary/20 px-4 py-2 rounded-xl font-bold flex items-center gap-2 group"
                        >
                          <Clock className="h-3.5 w-3.5" />
                          {slot}
                          <button 
                            onClick={() => handleToggleSlot(activeTab, slot)}
                            className="ml-1 text-primary/40 hover:text-primary transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {(!currentDaySchedule?.slots || currentDaySchedule.slots.length === 0) && (
                  <div className="flex flex-col items-center justify-center py-16 text-center bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                    <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                      <AlertCircle className="h-8 w-8 text-slate-300" />
                    </div>
                    <p className="text-slate-500 font-bold text-lg">Belum Ada Slot Terpilih</p>
                    <p className="text-slate-400 text-sm max-w-xs mt-2">
                      Silakan pilih dari slot waktu di atas atau tambah jam kustom untuk hari {activeTab}.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
            
            <CardFooter className="bg-slate-50/30 p-8 border-t border-slate-100 flex justify-end">
               <div className="flex items-center gap-3 text-slate-400 text-xs font-bold uppercase tracking-tight">
                  <span className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-primary" /> Auto-save mati</span>
                  <div className="h-1 w-1 rounded-full bg-slate-300" />
                  <span>Klik simpan untuk menerapkan</span>
               </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
