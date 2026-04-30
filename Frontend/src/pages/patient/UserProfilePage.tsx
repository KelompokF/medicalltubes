import { useState } from "react";
import { User, Shield, Trash2, Camera, MapPin } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { patientService } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import ConfirmModal from "@/components/ConfirmModal";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export default function UserProfilePage() {
  const [showDelete, setShowDelete] = useState(false);
  const queryClient = useQueryClient();

  const { data } = useQuery({ queryKey: ["patientProfile"], queryFn: () => patientService.getProfile().then((r) => r.data) });

  const mutation = useMutation({
    mutationFn: (payload: any) => patientService.updateProfile(payload).then((r) => r.data),
    onSuccess: (data) => {
      queryClient.setQueryData(["patientProfile"], data);
    }
  });

  // Location Sharing Query & Mutation (with optimistic update)
  const { data: locationData, isLoading: isLocationLoading } = useQuery({ 
    queryKey: ["locationSharing"], 
    queryFn: () => patientService.getLocationSharing().then((r) => r.data) 
  });

  const locationMutation = useMutation({
    mutationFn: (enabled: boolean) => patientService.updateLocationSharing(enabled).then((r) => r.data),
    onMutate: async (enabled: boolean) => {
      // Cancel any in-flight refetches
      await queryClient.cancelQueries({ queryKey: ["locationSharing"] });
      // Snapshot previous value
      const previous = queryClient.getQueryData(["locationSharing"]);
      // Optimistically update the cache so UI flips instantly
      queryClient.setQueryData(["locationSharing"], (old: any) => ({
        ...old,
        location_sharing_enabled: enabled,
      }));
      return { previous };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locationSharing"] });
      toast.success("Pengaturan lokasi berhasil diperbarui!");
    },
    onError: (_err, _enabled, context: any) => {
      // Rollback to previous value if server call fails
      queryClient.setQueryData(["locationSharing"], context?.previous);
      toast.error("Gagal memperbarui pengaturan lokasi. Silakan coba lagi.");
    },
  });

  const [form, setForm] = useState({
    full_name: data?.full_name || "",
    place_of_birth: data?.place_of_birth || "",
    date_of_birth: data?.date_of_birth || "",
    blood_type: data?.blood_type || "",
    allergies: data?.allergies || "",
    email: data?.email || "",
  });

  // keep form in sync when data loads
  if (data && form.full_name === "") {
    setForm({
      full_name: data.full_name || "",
      place_of_birth: data.place_of_birth || "",
      date_of_birth: data.date_of_birth || "",
      blood_type: data.blood_type || "",
      allergies: data.allergies || "",
      email: data.email || "",
    });
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-foreground">My Profile</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Info */}
          <Card className="shadow-card">
            <CardHeader><CardTitle className="flex items-center gap-2"><User className="h-5 w-5 text-primary" />Personal Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="relative">
                  <div className="h-20 w-20 rounded-full medical-gradient flex items-center justify-center text-primary-foreground font-bold text-2xl">{(form.full_name || "").split(" ").map(p => p[0]).slice(0,2).join("") || "JD"}</div>
                </div>
                <div>
                  <p className="font-semibold text-foreground">{form.full_name || "John Doe"}</p>
                  <p className="text-sm text-muted-foreground">{form.email || "email@example.com"}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Full Name</Label>
                  <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input value={form.email} disabled className="mt-1" />
                </div>
                <div>
                  <Label>Place of Birth</Label>
                  <Input value={form.place_of_birth} onChange={(e) => setForm({ ...form, place_of_birth: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <Label>Date of Birth</Label>
                  <Input type="date" value={form.date_of_birth || ""} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} className="mt-1" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Medical Data */}
          <Card className="shadow-card">
            <CardHeader><CardTitle>Medical Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Blood Type</Label>
                  <Select value={form.blood_type} onValueChange={(v) => setForm({ ...form, blood_type: v })}>
                    <SelectTrigger className="mt-1"><SelectValue>{form.blood_type}</SelectValue></SelectTrigger>
                    <SelectContent>{["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bt) => <SelectItem key={bt} value={bt}>{bt}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Allergies (optional)</Label><Textarea value={form.allergies} onChange={(e) => setForm({ ...form, allergies: e.target.value })} className="mt-1" /></div>
            </CardContent>
          </Card>

          {/* Privacy & Location */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Privacy & Location
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Bagikan Lokasi Secara Otomatis</Label>
                  <p className="text-sm text-muted-foreground">
                    Izinkan aplikasi mengirim lokasi terkinimu secara otomatis saat dalam kondisi darurat.
                  </p>
                </div>
                <Switch 
                  checked={locationData?.location_sharing_enabled ?? false}
                  onCheckedChange={(checked) => locationMutation.mutate(checked)}
                  disabled={locationMutation.isPending || isLocationLoading}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Security */}
          <Card className="shadow-card">
            <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-primary" />Security</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div><Label>Current Password</Label><Input type="password" className="mt-1" /></div>
              <div><Label>New Password</Label><Input type="password" className="mt-1" /></div>
              <Button variant="outline" className="w-full">Change Password</Button>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="space-y-3">
            <Button className="w-full medical-gradient text-primary-foreground" onClick={() => {
              mutation.mutate(form, {
                onSuccess: () => toast.success("Profile saved!"),
                onError: () => toast.error("Failed to save profile")
              });
            }}>Save Changes</Button>
            <Button variant="outline" className="w-full text-destructive border-destructive/20 hover:bg-destructive/5" onClick={() => setShowDelete(true)}>
              <Trash2 className="h-4 w-4 mr-2" />Delete Account
            </Button>
          </div>
        </div>
      </div>

      <ConfirmModal open={showDelete} onOpenChange={setShowDelete} title="Delete Account" description="This action cannot be undone. All your data will be permanently deleted." onConfirm={() => { setShowDelete(false); toast.error("Account deleted."); }} confirmText="Delete" variant="destructive" />
    </div>
  );
}
