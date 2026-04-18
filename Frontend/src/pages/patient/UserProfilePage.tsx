import { useState } from "react";
import { User, Shield, Trash2, Camera } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import ConfirmModal from "@/components/ConfirmModal";
import { toast } from "sonner";

export default function UserProfilePage() {
  const [showDelete, setShowDelete] = useState(false);

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
                  <div className="h-20 w-20 rounded-full medical-gradient flex items-center justify-center text-primary-foreground font-bold text-2xl">JD</div>
                  <button className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                    <Camera className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div>
                  <p className="font-semibold text-foreground">John Doe</p>
                  <p className="text-sm text-muted-foreground">john.doe@email.com</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><Label>Full Name</Label><Input defaultValue="John Doe" className="mt-1" /></div>
                <div><Label>Email</Label><Input defaultValue="john.doe@email.com" className="mt-1" /></div>
                <div><Label>Phone</Label><Input defaultValue="+1 (555) 123-4567" className="mt-1" /></div>
                <div><Label>Date of Birth</Label><Input type="date" defaultValue="1990-05-15" className="mt-1" /></div>
              </div>
            </CardContent>
          </Card>

          {/* Medical Data */}
          <Card className="shadow-card">
            <CardHeader><CardTitle>Medical Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><Label>Age</Label><Input defaultValue="35" type="number" className="mt-1" /></div>
                <div>
                  <Label>Blood Type</Label>
                  <Select defaultValue="O+">
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bt) => <SelectItem key={bt} value={bt}>{bt}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Allergies</Label><Textarea defaultValue="Penicillin, Peanuts" className="mt-1" /></div>
              <div><Label>Disease History</Label><Textarea defaultValue="Hypertension (managed since 2020)" className="mt-1" /></div>
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
            <Button className="w-full medical-gradient text-primary-foreground" onClick={() => toast.success("Profile saved!")}>Save Changes</Button>
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
