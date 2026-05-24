import { useState } from "react";
import { useTranslation } from "react-i18next";
import { 
  Activity, 
  Scale, 
  Ruler, 
  Plus, 
  History, 
  ClipboardList, 
  AlertCircle, 
  Pill,
  Trash2,
  Calendar,
  Loader2
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { healthRecordService } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";
import ConfirmModal from "@/components/ConfirmModal";

export default function HealthRecordPage() {
  const { t } = useTranslation();
  const [isAdding, setIsAdding] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: records, isLoading } = useQuery({
    queryKey: ["healthRecords"],
    queryFn: () => healthRecordService.getRecords().then((res) => res.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => healthRecordService.createRecord(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["healthRecords"] });
      toast.success(t("patient.healthRecord.savedSuccess"));
      setIsAdding(false);
      setForm({
        weight: "",
        height: "",
        diagnosed_conditions: "",
        allergies: "",
        current_medications: "",
        notes: "",
      });
    },
    onError: () => toast.error(t("patient.healthRecord.saveFailed")),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => healthRecordService.deleteRecord(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["healthRecords"] });
      toast.success(t("patient.healthRecord.deleteSuccess"));
      setDeleteId(null);
    },
    onError: () => toast.error(t("patient.healthRecord.deleteFailed")),
  });

  const [form, setForm] = useState({
    weight: "",
    height: "",
    diagnosed_conditions: "",
    allergies: "",
    current_medications: "",
    notes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      ...form,
      weight: form.weight ? parseFloat(form.weight) : null,
      height: form.height ? parseFloat(form.height) : null,
    });
  };

  const lastRecord = records && records.length > 0 ? records[0] : null;

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("patient.healthRecord.title")}</h1>
          <p className="text-muted-foreground">{t("patient.healthRecord.subtitle")}</p>
        </div>
        <Button 
          onClick={() => setIsAdding(!isAdding)} 
          className="medical-gradient text-white"
        >
          {isAdding ? <ClipboardList className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
          {isAdding ? t("patient.healthRecord.viewHistory") : t("patient.healthRecord.addNewRecord")}
        </Button>
      </div>

      {!isAdding && lastRecord && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-success/5 border-success/10">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-2 bg-success/10 rounded-lg text-success"><Scale className="h-5 w-5" /></div>
              <div>
                <p className="text-xs text-muted-foreground">{t("patient.healthRecord.weight")}</p>
                <p className="font-bold text-lg">{lastRecord.weight ? `${lastRecord.weight} kg` : "-"}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-accent/5 border-accent/10">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-2 bg-accent/10 rounded-lg text-accent"><Ruler className="h-5 w-5" /></div>
              <div>
                <p className="text-xs text-muted-foreground">{t("patient.healthRecord.height")}</p>
                <p className="font-bold text-lg">{lastRecord.height ? `${lastRecord.height} cm` : "-"}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {isAdding ? (
        <Card className="shadow-card overflow-hidden">
          <CardHeader className="bg-muted/30 border-b">
            <CardTitle className="text-lg">{t("patient.healthRecord.formTitle")}</CardTitle>
            <CardDescription>{t("patient.healthRecord.formDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Section 1: Vitals */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-primary flex items-center gap-2 uppercase tracking-wider">
                  <Activity className="h-4 w-4" /> {t("patient.healthRecord.vitals")}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="weight">{t("patient.healthRecord.weightKg")}</Label>
                    <Input id="weight" type="number" step="0.1" placeholder={t("patient.healthRecord.weightPlaceholder")} value={form.weight} onChange={(e) => setForm({...form, weight: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="height">{t("patient.healthRecord.heightCm")}</Label>
                    <Input id="height" type="number" placeholder={t("patient.healthRecord.heightPlaceholder")} value={form.height} onChange={(e) => setForm({...form, height: e.target.value})} />
                  </div>
                </div>
              </div>

              {/* Section 2: Medical History */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-sm font-semibold text-primary flex items-center gap-2 uppercase tracking-wider">
                  <ClipboardList className="h-4 w-4" /> {t("patient.healthRecord.medicalConditions")}
                </h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="conditions" className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-warning" /> {t("patient.healthRecord.diagnosedConditions")}
                    </Label>
                    <Textarea 
                      id="conditions" 
                      placeholder={t("patient.healthRecord.diagnosedPlaceholder")} 
                      value={form.diagnosed_conditions} 
                      onChange={(e) => setForm({...form, diagnosed_conditions: e.target.value})}
                      className="min-h-[100px]"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="allergies" className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-destructive" /> {t("patient.healthRecord.allergies")}
                      </Label>
                      <Input id="allergies" placeholder={t("patient.healthRecord.allergiesPlaceholder")} value={form.allergies} onChange={(e) => setForm({...form, allergies: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="meds" className="flex items-center gap-2">
                        <Pill className="h-4 w-4 text-accent" /> {t("patient.healthRecord.currentMedications")}
                      </Label>
                      <Input id="meds" placeholder={t("patient.healthRecord.currentMedsPlaceholder")} value={form.current_medications} onChange={(e) => setForm({...form, current_medications: e.target.value})} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Notes */}
              <div className="space-y-4 pt-4 border-t">
                <Label htmlFor="notes">{t("patient.healthRecord.additionalNotes")}</Label>
                <Textarea 
                  id="notes" 
                  placeholder={t("patient.healthRecord.notesPlaceholder")} 
                  value={form.notes} 
                  onChange={(e) => setForm({...form, notes: e.target.value})}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsAdding(false)}>{t("common.cancel")}</Button>
                <Button type="submit" className="medical-gradient text-white px-8" disabled={createMutation.isPending}>
                  {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {createMutation.isPending ? t("patient.healthRecord.saving") : t("patient.healthRecord.saveRecord")}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-foreground font-semibold">
            <History className="h-5 w-5 text-primary" />
            <span>{t("patient.healthRecord.activityHistory")}</span>
          </div>
          
          {isLoading ? (
            <div className="text-center py-20">
              <Loader2 className="animate-spin h-8 w-8 text-primary mx-auto" />
              <p className="mt-4 text-muted-foreground text-sm">{t("patient.healthRecord.loadingHistory")}</p>
            </div>
          ) : records?.length === 0 ? (
            <Card className="p-12 text-center border-dashed">
              <div className="bg-muted/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <ClipboardList className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg">{t("patient.healthRecord.noRecords")}</h3>
              <p className="text-muted-foreground max-w-xs mx-auto mt-2">{t("patient.healthRecord.noRecordsDesc")}</p>
              <Button variant="outline" className="mt-6" onClick={() => setIsAdding(true)}>{t("patient.healthRecord.createFirst")}</Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {records.map((record: any) => (
                <Card key={record.id} className="shadow-card hover:shadow-card-hover transition-all">
                  <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row">
                      <div className="p-4 md:w-48 bg-muted/30 flex md:flex-col justify-between md:justify-center items-center gap-2 border-b md:border-b-0 md:border-r">
                        <Calendar className="h-4 w-4 text-primary" />
                        <div className="text-center">
                          <p className="font-bold text-sm">{format(new Date(record.date), "dd MMM yyyy")}</p>
                          <p className="text-[10px] text-muted-foreground">{format(new Date(record.date), "HH:mm")}</p>
                        </div>
                      </div>
                      <div className="p-5 flex-1 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          {record.weight && (
                            <div>
                              <p className="text-[10px] uppercase text-muted-foreground font-semibold">{t("patient.healthRecord.weight")}</p>
                              <p className="text-sm font-medium">{record.weight} kg</p>
                            </div>
                          )}
                          {record.height && (
                            <div>
                              <p className="text-[10px] uppercase text-muted-foreground font-semibold">{t("patient.healthRecord.height")}</p>
                              <p className="text-sm font-medium">{record.height} cm</p>
                            </div>
                          )}
                        </div>

                        {(record.diagnosed_conditions || record.allergies || record.current_medications) && (
                          <div className="pt-3 border-t flex flex-wrap gap-2">
                            {record.diagnosed_conditions && (
                              <Badge variant="outline" className="bg-warning/5 text-warning border-warning/20 gap-1">
                                <AlertCircle className="h-3 w-3" /> {record.diagnosed_conditions}
                              </Badge>
                            )}
                            {record.allergies && (
                              <Badge variant="outline" className="bg-destructive/5 text-destructive border-destructive/20 gap-1">
                                <AlertCircle className="h-3 w-3" /> {t("patient.healthRecord.allergyLabel", { value: record.allergies })}
                              </Badge>
                            )}
                            {record.current_medications && (
                              <Badge variant="outline" className="bg-accent/5 text-accent border-accent/20 gap-1">
                                <Pill className="h-3 w-3" /> {record.current_medications}
                              </Badge>
                            )}
                          </div>
                        )}

                        {record.notes && (
                          <div className="text-xs text-muted-foreground bg-muted/20 p-2 rounded italic">
                            "{record.notes}"
                          </div>
                        )}
                      </div>
                      <div className="p-4 flex items-center justify-end border-t md:border-t-0 md:border-l">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-muted-foreground hover:text-destructive transition-colors"
                          onClick={() => setDeleteId(record.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      <ConfirmModal 
        open={!!deleteId} 
        onOpenChange={(open) => !open && setDeleteId(null)} 
        title={t("patient.healthRecord.deleteRecord")} 
        description={t("patient.healthRecord.deleteConfirmDesc")} 
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)} 
        confirmText={deleteMutation.isPending ? t("patient.healthRecord.deleting") : t("common.delete")} 
        variant="destructive" 
      />
    </div>
  );
}
