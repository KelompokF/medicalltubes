import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, MapPin, Star, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export default function SearchDoctorPage() {
  const [search, setSearch] = useState("");
  const [specialization, setSpecialization] = useState("All");
  const [location, setLocation] = useState("All");
  const [visibleCount, setVisibleCount] = useState(4);

  const doctors: any[] = [];
  const specializations: string[] = [];
  const locations: string[] = [];

  const filtered = doctors.filter((d) => {
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase());
    const matchSpec = specialization === "All" || d.specialization === specialization;
    const matchLoc = location === "All" || d.location === location;
    return matchSearch && matchSpec && matchLoc;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Find a Doctor</h1>
        <p className="text-muted-foreground mt-1">Search and connect with the best healthcare professionals.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by doctor name..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={specialization} onValueChange={setSpecialization}>
          <SelectTrigger className="w-full sm:w-48"><Filter className="h-4 w-4 mr-2" /><SelectValue /></SelectTrigger>
          <SelectContent>{specializations.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={location} onValueChange={setLocation}>
          <SelectTrigger className="w-full sm:w-48"><MapPin className="h-4 w-4 mr-2" /><SelectValue /></SelectTrigger>
          <SelectContent>{locations.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {/* Doctor Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.slice(0, visibleCount).map((doctor) => (
          <Card key={doctor.id} className="shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-0.5">
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className="h-14 w-14 rounded-full medical-gradient flex items-center justify-center text-primary-foreground font-bold text-lg shrink-0">
                  {doctor.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-foreground">{doctor.name}</h3>
                      <p className="text-sm text-muted-foreground">{doctor.specialization}</p>
                    </div>
                    <Badge variant={doctor.status === "available" ? "default" : "secondary"} className={doctor.status === "available" ? "bg-success/10 text-success border-success/20" : ""}>
                      {doctor.status === "available" ? "Available" : "Offline"}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 text-warning fill-warning" />{doctor.rating}</span>
                    <span>{doctor.experience} yrs exp</span>
                    <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{doctor.location}</span>
                  </div>
                  <div className="mt-3">
                    <Button size="sm" variant="outline" asChild>
                      <Link to={`/doctor/${doctor.id}`}>View Details</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && <p className="text-center text-muted-foreground py-12">No doctors found matching your criteria.</p>}

      {visibleCount < filtered.length && (
        <div className="text-center">
          <Button variant="outline" onClick={() => setVisibleCount((c) => c + 4)}>Load More</Button>
        </div>
      )}
    </div>
  );
}
