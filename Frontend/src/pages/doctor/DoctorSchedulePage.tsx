import { Calendar } from "lucide-react";

export default function DoctorSchedulePage() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
      <div className="rounded-full bg-primary/10 p-6 mb-4">
        <Calendar className="h-8 w-8 text-primary" />
      </div>
      <h2 className="text-xl font-bold text-foreground">Jadwal Praktik</h2>
      <p className="text-muted-foreground mt-2 max-w-sm">
        Fitur pengaturan jadwal praktik dokter sedang dalam pengembangan. 
        Silakan kembali lagi nanti.
      </p>
    </div>
  );
}
