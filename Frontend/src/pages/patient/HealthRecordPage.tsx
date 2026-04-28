import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Activity, Heart, Scale, Ruler, FileText, Plus, Trash2, Calendar, Loader2 } from "lucide-react";
import { healthRecordService } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import ConfirmModal from "@/components/ConfirmModal";

type HealthRecord = {
  id: string;
  user_id: string;
  date: string;
  blood_pressure: string | null;
  heart_rate: number | null;
  weight: number | null;
  height: number | null;
  notes: string | null;
  created_at: string;
};

export default function HealthRecordPage() {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [form, setForm] = useState({
    blood_pressure: "",
    heart_rate: "",
    weight: "",
    height: "",
    notes: ""
  });

  const { data: records, isLoading } = useQuery({
    queryKey: ["healthRecords"],
    queryFn: () => healthRecordService.getRecords().then((res) => res.data as HealthRecord[])
  });

  const createMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => healthRecordService.createRecord(payload).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["healthRecords"] });
      toast.success("Catatan kesehatan berhasil ditambahkan!");
      setShowAddForm(false);
      setForm({ blood_pressure: "", heart_rate: "", weight: "", height: "", notes: "" });
    },
    onError: () => toast.error("Gagal menambahkan catatan kesehatan")
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => healthRecordService.deleteRecord(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["healthRecords"] });
      toast.success("Catatan kesehatan berhasil dihapus");
      setDeleteId(null);
    },
    onError: () => toast.error("Gagal menghapus catatan kesehatan")
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      blood_pressure: form.blood_pressure || null,
      heart_rate: form.heart_rate ? parseInt(form.heart_rate) : null,
      weight: form.weight ? parseFloat(form.weight) : null,
      height: form.height ? parseFloat(form.height) : null,
      notes: form.notes || null
    };
    createMutation.mutate(payload);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Riwayat Kesehatan</h1>
          <p className="text-muted-foreground mt-1">Pantau terus perkembangan medis Anda.</p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)} className="medical-gradient">
          <Plus className="h-4 w-4 mr-2" />
          {showAddForm ? "Batal Tambah" : "Tambah Catatan"}
        </Button>
      </div>

      {/* Form Tambah Data Baru */}
      {showAddForm && (
        <Card className="shadow-card border-primary/20 animate-in slide-in-from-top-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Catatan Kesehatan Baru
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Tekanan Darah (mmHg)</Label>
                  <div className="relative">
                    <Activity className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Contoh: 120/80" className="pl-9" value={form.blood_pressure} onChange={(e) => setForm({...form, blood_pressure: e.target.value})} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Detak Jantung (bpm)</Label>
                  <div className="relative">
                    <Heart className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input type="number" placeholder="Contoh: 75" className="pl-9" value={form.heart_rate} onChange={(e) => setForm({...form, heart_rate: e.target.value})} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Berat Badan (kg)</Label>
                  <div className="relative">
                    <Scale className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input type="number" step="0.1" placeholder="Contoh: 65.5" className="pl-9" value={form.weight} onChange={(e) => setForm({...form, weight: e.target.value})} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Tinggi Badan (cm)</Label>
                  <div className="relative">
                    <Ruler className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input type="number" step="0.1" placeholder="Contoh: 170" className="pl-9" value={form.height} onChange={(e) => setForm({...form, height: e.target.value})} />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Keluhan / Catatan Tambahan</Label>
                <Textarea placeholder="Tuliskan keluhan atau catatan kesehatan Anda hari ini..." className="min-h-[100px]" value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} />
              </div>
              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Simpan Catatan
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Daftar Riwayat Kesehatan */}
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      ) : records?.length === 0 ? (
        <Card className="shadow-card bg-muted/30 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-primary/10 p-4 mb-4">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-1">Belum Ada Riwayat Kesehatan</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Anda belum pernah mencatat riwayat kesehatan. Tekan tombol "Tambah Catatan" di atas untuk mulai memantau kesehatan Anda.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {records?.map((record) => (
            <Card key={record.id} className="shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
              <CardContent className="p-5">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(record.date).toLocaleDateString("id-ID", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} • {new Date(record.date).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {record.blood_pressure && (
                        <div className="bg-primary/5 rounded-md p-3">
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1"><Activity className="h-3 w-3" /> Tensi</p>
                          <p className="font-semibold text-sm">{record.blood_pressure} <span className="text-[10px] font-normal text-muted-foreground">mmHg</span></p>
                        </div>
                      )}
                      {record.heart_rate && (
                        <div className="bg-destructive/5 rounded-md p-3">
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1"><Heart className="h-3 w-3" /> Detak Jantung</p>
                          <p className="font-semibold text-sm">{record.heart_rate} <span className="text-[10px] font-normal text-muted-foreground">bpm</span></p>
                        </div>
                      )}
                      {record.weight && (
                        <div className="bg-success/5 rounded-md p-3">
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1"><Scale className="h-3 w-3" /> Berat</p>
                          <p className="font-semibold text-sm">{record.weight} <span className="text-[10px] font-normal text-muted-foreground">kg</span></p>
                        </div>
                      )}
                      {record.height && (
                        <div className="bg-blue-500/5 rounded-md p-3">
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1"><Ruler className="h-3 w-3" /> Tinggi</p>
                          <p className="font-semibold text-sm">{record.height} <span className="text-[10px] font-normal text-muted-foreground">cm</span></p>
                        </div>
                      )}
                    </div>

                    {record.notes && (
                      <div className="pt-2 border-t text-sm">
                        <p className="text-muted-foreground font-medium mb-1">Catatan:</p>
                        <p className="text-foreground">{record.notes}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex md:flex-col justify-end items-start gap-2">
                    <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setDeleteId(record.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ConfirmModal 
        open={!!deleteId} 
        onOpenChange={(open) => !open && setDeleteId(null)} 
        title="Hapus Catatan" 
        description="Apakah Anda yakin ingin menghapus catatan kesehatan ini? Data yang dihapus tidak dapat dikembalikan." 
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)} 
        confirmText={deleteMutation.isPending ? "Menghapus..." : "Hapus"} 
        variant="destructive" 
      />
    </div>
  );
}