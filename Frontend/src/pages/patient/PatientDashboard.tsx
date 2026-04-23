import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Activity, Home, AlertTriangle, Pill, Search, Phone, Calendar, MessageSquare, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StatCard from "@/components/StatCard";
import { patientService } from "@/services/api";

export default function PatientDashboard() {
  const [patientStats, setPatientStats] = useState({
    totalConsultations: 0,
    homeVisitBookings: 0,
    emergencyRequests: 0,
    activePrescriptions: 0,
  });
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [upcomingAppointment, setUpcomingAppointment] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await patientService.getDashboard();
        if (response.data) {
          setPatientStats(response.data.stats);
          setRecentActivities(response.data.recentActivities);
          setUpcomingAppointment(response.data.upcomingAppointment);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (isLoading) {
    return <div className="flex items-center justify-center h-full">Loading dashboard data...</div>;
  }
  
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Banner */}
      <div className="rounded-2xl medical-gradient p-6 sm:p-8 text-primary-foreground">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Welcome back, John! 👋</h1>
        <p className="text-primary-foreground/80 text-sm sm:text-base">How are you feeling today? Let us help you stay healthy.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Consultations" value={patientStats.totalConsultations} icon={Activity} variant="primary" />
        <StatCard title="Home Visit Bookings" value={patientStats.homeVisitBookings} icon={Home} variant="success" />
        <StatCard title="Emergency Requests" value={patientStats.emergencyRequests} icon={AlertTriangle} variant="emergency" />
        <StatCard title="Active Prescriptions" value={patientStats.activePrescriptions} icon={Pill} variant="warning" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card className="shadow-card">
          <CardHeader><CardTitle className="text-lg">Quick Actions</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            {[
              { label: "Search Doctor", icon: Search, path: "/search-doctor", color: "bg-primary/10 text-primary" },
              { label: "Emergency", icon: Phone, path: "/emergency", color: "bg-emergency/10 text-emergency" },
              { label: "Book Home Visit", icon: Home, path: "/home-visit", color: "bg-success/10 text-success" },
              { label: "Start Consultation", icon: MessageSquare, path: "/chat", color: "bg-accent/10 text-accent" },
            ].map((action) => (
              <Link key={action.label} to={action.path}>
                <div className={`flex flex-col items-center gap-2 p-4 rounded-xl ${action.color} hover:scale-105 transition-transform cursor-pointer`}>
                  <action.icon className="h-6 w-6" />
                  <span className="text-xs font-medium text-center">{action.label}</span>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        {/* Upcoming Appointment */}
        <Card className="shadow-card">
          <CardHeader><CardTitle className="text-lg">Upcoming Appointment</CardTitle></CardHeader>
          <CardContent>
            {upcomingAppointment ? (
              <>
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-12 w-12 rounded-full medical-gradient flex items-center justify-center text-primary-foreground font-bold">SJ</div>
                  <div>
                    <p className="font-semibold text-foreground">{upcomingAppointment.doctor}</p>
                    <p className="text-sm text-muted-foreground">{upcomingAppointment.specialization}</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{upcomingAppointment.date} at {upcomingAppointment.time}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MessageSquare className="h-4 w-4" />
                    <span>{upcomingAppointment.type}</span>
                  </div>
                </div>
                <Button className="w-full mt-4" size="sm" asChild>
                  <Link to="/chat">Join Consultation</Link>
                </Button>
              </>
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">No upcoming appointments</p>
                <Button className="w-full mt-4" size="sm" asChild>
                  <Link to="/search-doctor">Book an Appointment</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="shadow-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Recent Activity</CardTitle>
              <Button variant="ghost" size="sm" className="text-primary">View All <ArrowRight className="h-4 w-4 ml-1" /></Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivities && recentActivities.length > 0 ? (
                recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className={`h-2 w-2 rounded-full mt-2 ${activity.status === "completed" ? "bg-success" : activity.status === "active" ? "bg-primary" : "bg-warning"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">{activity.date}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <Activity className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground text-sm">No recent activity</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
