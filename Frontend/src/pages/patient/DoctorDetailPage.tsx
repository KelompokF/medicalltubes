import { useParams, Link } from "react-router-dom";
import { Star, MapPin, Clock, DollarSign, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { doctors, doctorSchedule, doctorReviews } from "@/data/mockData";

export default function DoctorDetailPage() {
  const { id } = useParams();
  const doctor = doctors.find((d) => d.id === id) || doctors[0];

  return (
    <div className="space-y-6 animate-fade-in">
      <Button variant="ghost" size="sm" asChild><Link to="/search-doctor"><ArrowLeft className="h-4 w-4 mr-2" />Back</Link></Button>

      {/* Header */}
      <Card className="shadow-card overflow-hidden">
        <div className="h-24 medical-gradient" />
        <CardContent className="relative pt-0 pb-6 px-6">
          <div className="flex flex-col sm:flex-row items-start gap-4 -mt-10">
            <div className="h-20 w-20 rounded-full bg-card border-4 border-card medical-gradient flex items-center justify-center text-primary-foreground font-bold text-2xl shrink-0">
              {doctor.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-foreground">{doctor.name}</h1>
              <p className="text-muted-foreground">{doctor.specialization}</p>
              <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><Star className="h-4 w-4 text-warning fill-warning" />{doctor.rating} ({doctor.reviews} reviews)</span>
                <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{doctor.location}</span>
                <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{doctor.experience} yrs exp</span>
                <span className="flex items-center gap-1"><DollarSign className="h-4 w-4" />${doctor.fee}/session</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button asChild><Link to="/chat">Start Consultation</Link></Button>
              <Button variant="outline" asChild><Link to="/home-visit">Book Home Visit</Link></Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-card">
            <CardHeader><CardTitle>About</CardTitle></CardHeader>
            <CardContent><p className="text-muted-foreground leading-relaxed">{doctor.about}</p></CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader><CardTitle>Available Schedule</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {doctorSchedule.map((day) => (
                  <div key={day.date}>
                    <p className="font-medium text-foreground text-sm mb-2">{day.date}</p>
                    <div className="flex flex-wrap gap-2">
                      {day.slots.map((slot) => (
                        <Badge key={slot} variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors">{slot}</Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="shadow-card">
            <CardHeader><CardTitle>Patient Reviews</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {doctorReviews.map((review) => (
                <div key={review.id} className="border-b last:border-0 pb-4 last:pb-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm text-foreground">{review.patient}</span>
                    <div className="flex">{Array.from({ length: review.rating }).map((_, i) => <Star key={i} className="h-3 w-3 text-warning fill-warning" />)}</div>
                  </div>
                  <p className="text-sm text-muted-foreground">{review.comment}</p>
                  <p className="text-xs text-muted-foreground mt-1">{review.date}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
