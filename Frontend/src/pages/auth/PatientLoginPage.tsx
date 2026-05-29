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
import medicallIcon from "@/assets/medicall-icon.png";
import { authService, patientService } from "@/services/api";
import { GoogleLogin } from "@react-oauth/google";
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

  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (credentialResponse.credential) {
      try {
        const res = await authService.googleLogin(credentialResponse.credential);
        const token = res.data?.access_token;
        if (token) {
          localStorage.setItem("access_token", token);
          const r = await authService.getMe();
          const user = r.data;
          localStorage.setItem("user", JSON.stringify(user));
          toast.success(t("auth.welcomeBackToast", "Welcome back!"));
          
          const isPatient = user.role === "patient" || !user.role;
          if (isPatient) {
            try {
              const profileRes = await patientService.getProfile();
              const p = profileRes.data;
              const needsProfile = !p.place_of_birth || !p.date_of_birth || !p.blood_type;
              if (needsProfile) navigate("/profile");
              else navigate("/dashboard");
            } catch (e) {
              navigate("/dashboard");
            }
          } else if (user.role === "doctor") navigate("/doctor-dashboard");
          else if (user.role === "ambulance") navigate("/ambulance-dashboard");
          else if (user.role === "admin") navigate("/admin");
          else navigate("/dashboard");
        }
      } catch (err: any) {
        toast.error("Google Login Failed: " + (err.response?.data?.detail || "Unknown error"));
      }
    }
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
                .then(async (r) => {
                  const user = r.data;
                  localStorage.setItem("user", JSON.stringify(user));
                  toast.success(t("auth.welcomeBackToast"));
                  // If patient and profile incomplete, force profile page first
                  const isPatient = user.role === "patient" || !user.role;
                  if (isPatient) {
                    try {
                      const profileRes = await patientService.getProfile();
                      const p = profileRes.data;
                      const needsProfile = !p.place_of_birth || !p.date_of_birth || !p.blood_type;
                      if (needsProfile) navigate("/profile");
                      else navigate("/dashboard");
                    } catch (e) {
                      navigate("/dashboard");
                    }
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
      <div 
        className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-12 bg-cover bg-center"
        style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=2070&auto=format&fit=crop")' }}
      >
        <div className="absolute inset-0 bg-blue-900/60 mix-blend-multiply" />
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 text-center w-full max-w-lg mx-auto flex flex-col items-center">
          <div className="bg-white p-6 rounded-2xl shadow-2xl mb-8 animate-float flex items-center justify-center">
            <img src={medicallIcon} alt="Medicall Icon" className="h-32 sm:h-40 w-auto object-contain" />
          </div>
          <h2 className="text-4xl font-bold text-white mb-4">{t("auth.welcomeTo")}.</h2>
          <p className="text-white/90 text-lg max-w-md mx-auto">{t("auth.platformDesc")}</p>
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

          <div className="flex items-center gap-3 mb-8">
            <span className="text-3xl font-bold text-foreground leading-none">Medicall</span>
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
              {isLogin && <Link to="/forgot-password" className="text-sm text-primary hover:underline">{t("auth.forgotPassword")}</Link>}
            </div>
            <Button type="submit" className="w-full medical-gradient text-primary-foreground hover:opacity-90 transition-opacity" size="lg">
              {isLogin ? t("auth.signInBtn") : t("auth.createAccountBtn")}
            </Button>
            
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>
            
            <div className="flex justify-center w-full">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => {
                  toast.error("Google Login Failed");
                }}
                useOneTap
              />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}