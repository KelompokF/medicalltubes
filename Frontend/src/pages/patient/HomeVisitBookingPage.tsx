import { useState } from "react";
import { Calendar, Clock, MapPin, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import ConfirmModal from "@/components/ConfirmModal";
import { toast } from "sonner";

export default function HomeVisitBookingPage() {
  const doctors: any[] = [];
  const timeSlots: string[] = [];
  
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const doctor = doctors[0] || { name: "", specialization: "", fee: 0 };

  const handleBook = () => {
    setShowConfirm(false);
    toast.success("Home visit booked successfully!");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Book Home Visit</h1>
        <p className="text-muted-foreground mt-1">Schedule a doctor visit to your location.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Doctor Summary */}
          <Card className="shadow-card">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-14 w-14 rounded-full medical-gradient flex items-center justify-center text-primary-foreground font-bold text-lg">SJ</div>
              <div>
                <h3 className="font-semibold text-foreground">{doctor.name}</h3>
                <p className="text-sm text-muted-foreground">{doctor.specialization} • ${doctor.fee}/visit</p>
              </div>
            </CardContent>
          </Card>

          {/* Date Selection */}
          <Card className="shadow-card">
            <CardHeader><CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5 text-primary" />Select Date</CardTitle></CardHeader>
            <CardContent>
              <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} min="2026-04-14" />
            </CardContent>
          </Card>

          {/* Time Slots */}
          <Card className="shadow-card">
            <CardHeader><CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5 text-primary" />Available Time Slots</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {timeSlots.map((slot) => (
                  <Badge
                    key={slot}
                    variant={selectedTime === slot ? "default" : "outline"}
                    className={`cursor-pointer transition-all ${selectedTime === slot ? "bg-primary text-primary-foreground" : "hover:bg-primary/10"}`}
                    onClick={() => setSelectedTime(slot)}
                  >{slot}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Address */}
          <Card className="shadow-card">
            <CardHeader><CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5 text-primary" />Your Address</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Full Address</Label>
                <Input placeholder="123 Main Street, Apt 4B" value={address} onChange={(e) => setAddress(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="flex items-center gap-2"><FileText className="h-4 w-4" />Additional Notes</Label>
                <Textarea placeholder="Any specific instructions for the doctor..." value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary */}
        <Card className="shadow-card h-fit sticky top-24">
          <CardHeader><CardTitle>Booking Summary</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Doctor</span><span className="font-medium text-foreground">{doctor.name}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span className="font-medium text-foreground">{selectedDate || "Not selected"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Time</span><span className="font-medium text-foreground">{selectedTime || "Not selected"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Fee</span><span className="font-medium text-foreground">${doctor.fee}</span></div>
            <div className="border-t pt-3">
              <Button className="w-full medical-gradient text-primary-foreground" onClick={() => setShowConfirm(true)} disabled={!selectedDate || !selectedTime || !address}>
                Confirm Booking
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <ConfirmModal open={showConfirm} onOpenChange={setShowConfirm} title="Confirm Home Visit" description={`Book a home visit with ${doctor.name} on ${selectedDate} at ${selectedTime}?`} onConfirm={handleBook} confirmText="Book Visit" />
    </div>
  );
}
