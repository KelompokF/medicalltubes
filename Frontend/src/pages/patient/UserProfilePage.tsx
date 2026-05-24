import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { User, Shield, Trash2, Camera, MapPin } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { patientService, authService } from "@/services/api";
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
  const { t } = useTranslation();
  const [showDelete, setShowDelete] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [passwords, setPasswords] = useState({ current: "", new: "" });
  const queryClient = useQueryClient();

  const { data } = useQuery({ queryKey: ["patientProfile"], queryFn: () => patientService.getProfile().then((r) => r.data) });

  const mutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => patientService.updateProfile(payload).then((r) => r.data),
    onSuccess: (data) => {
      queryClient.setQueryData(["patientProfile"], data);
      queryClient.invalidateQueries({ queryKey: ["me"] });
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem("user", JSON.stringify({ ...user, full_name: data.full_name }));
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
      await queryClient.cancelQueries({ queryKey: ["locationSharing"] });
      const previous = queryClient.getQueryData(["locationSharing"]);
      queryClient.setQueryData(["locationSharing"], (old: any) => ({
        ...old,
        location_sharing_enabled: enabled,
      }));
      return { previous };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locationSharing"] });
      toast.success(t("patient.userProfile.locationUpdated"));
    },
    onError: (_err, _enabled, context: any) => {
      queryClient.setQueryData(["locationSharing"], context?.previous);
      toast.error(t("patient.userProfile.locationUpdateFailed"));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => patientService.deleteAccount(),
    onSuccess: () => {
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    },
    onError: () => {
      toast.error(t("patient.userProfile.deleteAccountFailed"));
    }
  });

  const [form, setForm] = useState({
    full_name: "",
    place_of_birth: "",
    date_of_birth: "",
    blood_type: "",
    allergies: "",
    email: "",
  });

  // keep form in sync when data loads (only once)
  useEffect(() => {
    if (data && !isLoaded) {
      setForm({
        full_name: data.full_name || "",
        place_of_birth: data.place_of_birth || "",
        date_of_birth: data.date_of_birth || "",
        blood_type: data.blood_type || "",
        allergies: data.allergies || "",
        email: data.email || "",
      });
      setIsLoaded(true);
    }
  }, [data, isLoaded]);

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-foreground">{t("patient.userProfile.title")}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Info */}
          <Card className="shadow-card">
            <CardHeader><CardTitle className="flex items-center gap-2"><User className="h-5 w-5 text-primary" />{t("patient.userProfile.personalInfo")}</CardTitle></CardHeader>
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
                  <Label>{t("patient.userProfile.fullName")}</Label>
                  <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <Label>{t("patient.userProfile.email")}</Label>
                  <Input value={form.email} disabled className="mt-1" />
                </div>
                <div>
                  <Label>{t("patient.userProfile.placeOfBirth")}</Label>
                  <Input value={form.place_of_birth} onChange={(e) => setForm({ ...form, place_of_birth: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <Label>{t("patient.userProfile.dateOfBirth")}</Label>
                  <Input type="date" value={form.date_of_birth || ""} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} className="mt-1" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Medical Data */}
          <Card className="shadow-card">
            <CardHeader><CardTitle>{t("patient.userProfile.medicalInfo")}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>{t("patient.userProfile.bloodType")}</Label>
                  <Select value={form.blood_type} onValueChange={(v) => setForm({ ...form, blood_type: v })}>
                    <SelectTrigger className="mt-1"><SelectValue>{form.blood_type}</SelectValue></SelectTrigger>
                    <SelectContent>{["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bt) => <SelectItem key={bt} value={bt}>{bt}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>{t("patient.userProfile.allergies")}</Label><Textarea value={form.allergies} onChange={(e) => setForm({ ...form, allergies: e.target.value })} className="mt-1" /></div>
            </CardContent>
          </Card>

          {/* Privacy & Location */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                {t("patient.userProfile.privacyLocation")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">{t("patient.userProfile.autoShareLocation")}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t("patient.userProfile.autoShareLocationDesc")}
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
            <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-primary" />{t("patient.userProfile.security")}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>{t("patient.userProfile.currentPassword")}</Label>
                <Input type="password" value={passwords.current} onChange={(e) => setPasswords(p => ({ ...p, current: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label>{t("patient.userProfile.newPassword")}</Label>
                <Input type="password" value={passwords.new} onChange={(e) => setPasswords(p => ({ ...p, new: e.target.value }))} className="mt-1" />
              </div>
              <Button variant="outline" className="w-full" onClick={() => {
                if (!passwords.current || !passwords.new) {
                  toast.error(t("patient.userProfile.fillBothPasswords"));
                  return;
                }
                authService.changePassword({ current_password: passwords.current, new_password: passwords.new })
                  .then(() => {
                    toast.success(t("patient.userProfile.passwordChanged"));
                    setPasswords({ current: "", new: "" });
                  })
                  .catch((err) => toast.error(err.response?.data?.detail || t("patient.userProfile.passwordChangeFailed")));
              }}>{t("patient.userProfile.changePassword")}</Button>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="space-y-3">
            <Button className="w-full medical-gradient text-primary-foreground" onClick={() => {
              if (!form.full_name || form.full_name.trim() === "") {
                toast.error(t("patient.userProfile.nameEmpty"));
                return;
              }
              if (form.place_of_birth && !/^[a-zA-Z0-9\s]+$/.test(form.place_of_birth)) {
                toast.error(t("patient.userProfile.birthPlaceSymbols"));
                return;
              }
              mutation.mutate(form, {
                onSuccess: () => toast.success(t("patient.userProfile.profileSaved")),
                onError: () => toast.error(t("patient.userProfile.profileSaveFailed"))
              });
            }}>{t("patient.userProfile.saveChanges")}</Button>
            <Button variant="outline" className="w-full text-destructive border-destructive/20 hover:bg-destructive/5" onClick={() => setShowDelete(true)}>
              <Trash2 className="h-4 w-4 mr-2" />{t("patient.userProfile.deleteAccount")}
            </Button>
          </div>
        </div>
      </div>

      <ConfirmModal 
        open={showDelete} 
        onOpenChange={setShowDelete} 
        title={t("patient.userProfile.deleteAccountTitle")} 
        description={t("patient.userProfile.deleteAccountDesc")} 
        onConfirm={() => { 
          setShowDelete(false); 
          deleteMutation.mutate(); 
        }} 
        confirmText={deleteMutation.isPending ? t("patient.userProfile.deleting") : t("common.delete")} 
        variant="destructive" 
      />
    </div>
  );
}
