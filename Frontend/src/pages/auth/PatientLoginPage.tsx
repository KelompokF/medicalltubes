import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Heart, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import medicalIllustration from "@/assets/medical-illustration.jpg";
import { authService } from "@/services/api";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function PatientLoginPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // ================= VALIDATION =================
  const validate = () => {
    const e: Record<string, string> = {};

    if (!isLogin && !form.name) e.name = t("auth.nameRequired");
    if (!form.email) e.email = t("auth.emailRequired");
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = t("auth.invalidEmail");

    if (!form.password) e.password = t("auth.passwordRequired");
    else if (form.password.length < 6) e.password = t("auth.minChars");

    if (!isLogin && form.password !== form.confirmPassword) {
      e.confirmPassword = t("auth.passwordMismatch");
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ================= SUBMIT =================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      if (isLogin) {
        // login flow
        authService
          .login({ email: form.email, password: form.password })
          .then((res) => {
            const token = res.data?.access_token;
            if (token) {
              localStorage.setItem("access_token", token);
              // fetch user and route based on role
              authService
                .getMe()
                .then((r) => {
                  const user = r.data;
                  localStorage.setItem("user", JSON.stringify(user));
                  toast.success(t("auth.welcomeBackToast"));
                  // If patient and profile incomplete, force profile page first
                  const isPatient = user.role === "patient" || !user.role;
                  const needsProfile = !user.place_of_birth || !user.date_of_birth || !user.blood_type;
                  if (isPatient && needsProfile) {
                    navigate("/profile");
                  } else if (user.role === "doctor") navigate("/doctor-dashboard");
                  else if (user.role === "ambulance") navigate("/ambulance-dashboard");
                  else if (user.role === "admin") navigate("/admin");
                  else navigate("/dashboard");
                })
                .catch(() => {
                  toast.success(t("auth.signedIn"));
                  navigate("/dashboard");
                });
            } else {
              toast.error(t("auth.loginFailedNoToken"));
            }
          })
          .catch((err) => {
            const msg = err.response?.data?.detail || t("auth.loginFailed");
            toast.error(msg);
          });
      } else {
        // register flow
        authService
          .register({ full_name: form.name, email: form.email, password: form.password })
          .then(() => {
            toast.success(t("auth.accountCreated"));
            setIsLogin(true);
          })
          .catch((err) => {
            const msg = err.response?.data?.detail || t("auth.registrationFailed");
            toast.error(msg);
          });
      }
    }
  };

  // ================= UI =================
  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 medical-gradient relative items-center justify-center p-12">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 to-accent/80" />
        <div className="relative z-10 text-center">
          <img src={medicalIllustration} alt="Healthcare" className="w-80 h-auto mx-auto rounded-2xl shadow-elevated mb-8 animate-float" width={800} height={1024} />
          <h2 className="text-3xl font-bold text-primary-foreground mb-3">{t("auth.welcomeTo")}</h2>
          <p className="text-primary-foreground/80 text-lg max-w-md mx-auto">{t("auth.platformDesc")}</p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-background">
        <div className="w-full max-w-md animate-fade-in">
          <div className="flex items-center justify-between mb-6">
            <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" /> {t("auth.backToHome")}
            </Link>
            <LanguageSwitcher />
          </div>

          <div className="flex items-center gap-2 mb-8">
            <div className="rounded-lg medical-gradient p-2">
              <Heart className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <span className="text-2xl font-bold text-foreground">Medicall</span>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{t("auth.patientPortal")}</p>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-1">{isLogin ? t("auth.signIn") : t("auth.createAccount")}</h1>
          <p className="text-muted-foreground mb-6">{isLogin ? t("auth.welcomeBack") : t("auth.joinMedicall")}</p>

          <div className="flex rounded-lg bg-muted p-1 mb-6">
            <button onClick={() => setIsLogin(true)} className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${isLogin ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}>{t("auth.login")}</button>
            <button onClick={() => setIsLogin(false)} className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${!isLogin ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}>{t("auth.register")}</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <Label htmlFor="name">{t("auth.fullName")}</Label>
                <Input id="name" placeholder="John Doe" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1" />
                {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
              </div>
            )}
            <div>
              <Label htmlFor="email">{t("auth.email")}</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1" />
              {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
            </div>
            <div>
              <Label htmlFor="password">{t("auth.password")}</Label>
              <div className="relative mt-1">
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive mt-1">{errors.password}</p>}
            </div>
            {!isLogin && (
              <div>
                <Label htmlFor="confirm">{t("auth.confirmPassword")}</Label>
                <Input id="confirm" type="password" placeholder="••••••••" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} className="mt-1" />
                {errors.confirmPassword && <p className="text-xs text-destructive mt-1">{errors.confirmPassword}</p>}
              </div>
            )}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox id="remember" />
                <Label htmlFor="remember" className="text-sm font-normal">{t("auth.rememberMe")}</Label>
              </div>
              {isLogin && <button type="button" className="text-sm text-primary hover:underline">{t("auth.forgotPassword")}</button>}
            </div>
            <Button type="submit" className="w-full medical-gradient text-primary-foreground hover:opacity-90 transition-opacity" size="lg">
              {isLogin ? t("auth.signInBtn") : t("auth.createAccountBtn")}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}