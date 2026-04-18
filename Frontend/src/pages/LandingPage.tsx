import { Link } from "react-router-dom";
import { ArrowRight, Stethoscope, Ambulance, Home, MessageCircle, Shield, Clock, MapPin, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/medicall-logo.png";

const features = [
  { icon: MessageCircle, title: "Online Consultation", desc: "Chat with verified doctors anytime, anywhere from your device." },
  { icon: Home, title: "Home Visit", desc: "Book a doctor to visit your home with just a few taps." },
  { icon: Ambulance, title: "Emergency Response", desc: "Request the nearest ambulance instantly during emergencies." },
  { icon: Stethoscope, title: "Find Specialists", desc: "Search and connect with specialists matching your needs." },
];

const stats = [
  { value: "500+", label: "Verified Doctors" },
  { value: "24/7", label: "Emergency Support" },
  { value: "10k+", label: "Happy Patients" },
  { value: "50+", label: "Cities Covered" },
];

const steps = [
  { icon: Shield, title: "Create Account", desc: "Sign up as a patient in less than a minute." },
  { icon: Stethoscope, title: "Choose a Service", desc: "Consult online, book a home visit, or call emergency." },
  { icon: Heart, title: "Get Care", desc: "Receive professional healthcare wherever you are." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur bg-background/80 border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="Medicall logo" className="h-10 w-auto" />
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#how" className="hover:text-foreground transition-colors">How it works</a>
            <a href="#about" className="hover:text-foreground transition-colors">About</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link to="/login">
              <Button size="sm" className="medical-gradient text-primary-foreground hover:opacity-90">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
        <div className="relative max-w-7xl mx-auto px-6 py-20 lg:py-28 grid lg:grid-cols-2 gap-12 items-center">
          <div className="animate-fade-in">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold mb-6">
              <Heart className="h-3 w-3" /> SDG 3 — Good Health & Well-being
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6">
              Accessible Healthcare for <span className="text-primary">Everyone</span>, Anywhere.
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl">
              Medicall connects patients with trusted doctors, home visit services, and emergency response — all in one modern platform built for you.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/login">
                <Button size="lg" className="medical-gradient text-primary-foreground hover:opacity-90 w-full sm:w-auto">
                  Get Started <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <a href="#features">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">Learn More</Button>
              </a>
            </div>

            <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-6">
              {stats.map((s) => (
                <div key={s.label}>
                  <div className="text-2xl font-bold text-foreground">{s.value}</div>
                  <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative animate-fade-in">
            <div className="absolute -inset-6 bg-gradient-to-tr from-primary/20 to-accent/20 rounded-3xl blur-2xl" />
            <div className="relative bg-card rounded-3xl shadow-elevated p-8 border">
              <img src={logo} alt="Medicall — Accessible Healthcare for Everyone, Anywhere" className="w-full h-auto animate-float" />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">Everything you need for your health</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">A complete healthcare ecosystem designed around the patient experience.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <div key={f.title} className="group rounded-2xl bg-card p-6 border hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300">
                <div className="inline-flex rounded-xl bg-primary/10 text-primary p-3 mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">How it works</h2>
            <p className="text-muted-foreground">Three simple steps to better care.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {steps.map((s, i) => (
              <div key={s.title} className="relative rounded-2xl border bg-card p-8 text-center">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full medical-gradient text-primary-foreground flex items-center justify-center text-sm font-bold">
                  {i + 1}
                </div>
                <div className="inline-flex rounded-2xl bg-primary/10 text-primary p-4 mb-4 mt-2">
                  <s.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="about" className="py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="relative overflow-hidden rounded-3xl medical-gradient p-10 sm:p-14 text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/90 to-accent/80" />
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-bold text-primary-foreground mb-3">Ready to take care of your health?</h2>
              <p className="text-primary-foreground/90 max-w-xl mx-auto mb-8">Join thousands of patients already trusting Medicall for their healthcare needs.</p>
              <Link to="/login">
                <Button size="lg" variant="secondary" className="font-semibold">
                  Sign in as Patient <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src={logo} alt="Medicall" className="h-8 w-auto" />
          </div>
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <MapPin className="h-4 w-4" /> Serving patients worldwide
            <span className="mx-2">•</span>
            <Clock className="h-4 w-4" /> 24/7 support
          </p>
          <p className="text-xs text-muted-foreground">© 2026 Medicall. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
