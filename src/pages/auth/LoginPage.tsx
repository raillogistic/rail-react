import React, { Suspense, lazy, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/shared/routing/paths";
import { useAuthContext } from "@/auth/context";
import { MFAChallenge } from "@/auth/components";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  AlertCircle,
  WifiOff,
  ArrowRight,
  Loader2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Checkbox } from "@/lib/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
  isServerOfflineError,
  onOfflineStatusChange,
  testServerConnectivity,
} from "@/utils/offline-detector";
import Logo from "@/assets/logos/logo.png";
import Cover960 from "@/assets/images/cover-960.jpg";
import Cover1600 from "@/assets/images/cover-1600.jpg";

const loginSchema = z.object({
  username: z.string().min(1, "Le nom d'utilisateur est requis"),
  password: z.string().min(1, "Le mot de passe est requis"),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

const MFASetupPage = lazy(() =>
  import("./MFASetupPage").then((module) => ({
    default: module.MFASetupPage,
  })),
);

// --- Custom Internal Components for Unique Design ---

interface CustomInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon: React.ReactNode;
  error?: string;
}

const CustomInput = React.forwardRef<HTMLInputElement, CustomInputProps>(
  ({ label, icon, error, ...props }, ref) => (
    <div className="space-y-2 group">
      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 ml-1 transition-colors group-focus-within:text-primary">
        {label}
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground/40 group-focus-within:text-primary transition-colors">
          {icon}
        </div>
        <input
          {...props}
          ref={ref}
          className={cn(
            "w-full h-14 pl-12 pr-4 bg-muted/20 border-2 border-transparent rounded-2xl text-sm font-semibold transition-all outline-none",
            "placeholder:text-muted-foreground/30",
            "focus:bg-background focus:border-primary/20 focus:shadow-[0_8px_20px_-10px_rgba(var(--primary),0.15)]",
            error
              ? "border-destructive/30 bg-destructive/5"
              : "hover:bg-muted/40",
          )}
        />
        {error && (
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
            <AlertCircle className="h-4 w-4 text-destructive" />
          </div>
        )}
      </div>
      {error && (
        <p className="text-[10px] font-bold text-destructive ml-1 animate-in slide-in-from-top-1">
          {error}
        </p>
      )}
    </div>
  ),
);
CustomInput.displayName = "CustomInput";

interface CustomButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
}

const CustomButton = ({
  children,
  isLoading,
  disabled,
  className,
  ...props
}: CustomButtonProps) => (
  <button
    {...props}
    disabled={disabled || isLoading}
    className={cn(
      "group relative overflow-hidden h-14 w-full rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all active:scale-95 disabled:opacity-70 disabled:active:scale-100",
      "bg-foreground text-background shadow-[0_20px_40px_-15px_rgba(0,0,0,0.3)] hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.4)] hover:-translate-y-0.5",
      "before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/0 before:via-white/10 before:to-white/0 before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-1000",
      className,
    )}
  >
    <div className="relative flex items-center justify-center gap-3">
      {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : children}
    </div>
  </button>
);

// --- Main Page Component ---

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    login,
    verifyMFA,
    logout,
    isLoading,
    error,
    clearError,
    status,
    mfaSetupRequired,
    ephemeralToken,
  } = useAuthContext();
  const [showPassword, setShowPassword] = useState(false);
  const [isServerOnline, setIsServerOnline] = useState(true);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
      rememberMe: true,
    },
  });

  useEffect(() => {
    const checkConnectivity = async () => {
      const isOnline = await testServerConnectivity();
      setIsServerOnline(isOnline);
    };

    checkConnectivity();
    const cleanup = onOfflineStatusChange((isOffline) =>
      setIsServerOnline(!isOffline),
    );
    return cleanup;
  }, []);

  useEffect(() => {
    if (error && isServerOfflineError(error)) {
      const checkConnectivity = async () => {
        const isOnline = await testServerConnectivity();
        setIsServerOnline(isOnline);
      };
      checkConnectivity();
    }
  }, [error]);

  const onSubmit = async (data: LoginFormData) => {
    try {
      clearError();
      await login(data);
      reset();
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const handleMFAVerify = async (code: string) => {
    try {
      clearError();
      await verifyMFA(code);
    } catch (error) {
      console.error("MFA error:", error);
    }
  };

  const handleCancelMFA = async () => {
    await logout();
    clearError();
  };

  const handleForgotPassword = () => {
    navigate(ROUTES.FORGOT_PASSWORD);
  };

  return (
    <div className="flex min-h-screen w-full bg-[#fdfdfd] selection:bg-primary/20">
      {/* Brand Section (Left in new design for balance) */}
      <div className="hidden lg:flex lg:w-[50%] xl:w-[60%] relative flex-col justify-between p-12 overflow-hidden bg-[#0a0a0b]">
        {/* Background Effects */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px] -mr-96 -mt-96 opacity-50" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[100px] -ml-48 -mb-48 opacity-30" />

        <img
          src={Cover960}
          srcSet={`${Cover960} 960w, ${Cover1600} 1600w`}
          sizes="(min-width: 1536px) 60vw, (min-width: 1024px) 50vw, 100vw"
          loading="lazy"
          decoding="async"
          fetchPriority="low"
          alt="Maintenance"
          className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-luminosity grayscale transition-transform duration-[10s] hover:scale-110"
        />

        <div className="relative z-10 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center p-2 shadow-2xl ring-1 ring-white/20">
            <img
              src={Logo}
              alt="Logo"
              className="h-full w-full object-contain"
            />
          </div>
          <span className="text-sm font-black uppercase tracking-[0.4em] text-white/90">
            Rail Logistics
          </span>
        </div>

        <div className="relative z-10 max-w-xl space-y-8 animate-in slide-in-from-bottom-12 duration-1000 delay-200">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
              <Sparkles className="h-3 w-3 text-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
              <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">
                Technologie de pointe
              </span>
            </div>
            <h1 className="text-6xl xl:text-7xl font-black text-white leading-[1.05] tracking-tight">
              L'excellence <br /> en mouvement.
            </h1>
          </div>
          <p className="text-lg text-white/50 leading-relaxed font-medium">
            Propulser la maintenance ferroviaire vers de nouveaux standards de
            précision, de sécurité et d'efficacité opérationnelle.
          </p>

          <div className="pt-8 flex items-center gap-12">
            <div className="space-y-1">
              <p className="text-2xl font-black text-white">99.9%</p>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                Disponibilité
              </p>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div className="space-y-1">
              <p className="text-2xl font-black text-white">24/7</p>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                Surveillance
              </p>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">
          <span>© {new Date().getFullYear()} Rail Logistics</span>
          <div className="flex gap-6">
            <span className="hover:text-white/60 cursor-pointer transition-colors">
              Support
            </span>
            <span className="hover:text-white/60 cursor-pointer transition-colors">
              Confidentialité
            </span>
          </div>
        </div>
      </div>

      {/* Form Section */}
      <div className="flex flex-col flex-1 relative bg-background">
        <div className="flex-1 flex flex-col justify-center px-8 py-12 sm:px-12 md:px-20 xl:px-32">
          <div className="w-full max-w-sm mx-auto space-y-12 animate-in fade-in slide-in-from-right-12 duration-1000">
            <div className="space-y-2">
              <h2 className="text-4xl font-black tracking-tighter text-foreground">
                {status === "mfa_required" ? "Sécurité" : "Connexion"}
              </h2>
              <div className="h-1 w-12 bg-primary rounded-full shadow-[0_0_15px_rgba(var(--primary),0.4)]" />
            </div>

            {/* Status Messages */}
            {!isServerOnline && (
              <div className="p-4 rounded-2xl bg-orange-500/5 border border-orange-500/20 flex items-center gap-3 text-orange-600 animate-pulse">
                <WifiOff className="h-5 w-5 shrink-0" />
                <p className="text-xs font-bold uppercase tracking-wider">
                  Serveur déconnecté
                </p>
              </div>
            )}

            {error && status !== "mfa_required" && (
              <div className="p-4 rounded-2xl bg-destructive/5 border border-destructive/20 flex items-start gap-3 text-destructive animate-in zoom-in-95">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs font-black uppercase tracking-wider">
                    Erreur système
                  </p>
                  <p className="text-xs font-medium opacity-80">
                    {error.userMessage || error.message}
                  </p>
                </div>
              </div>
            )}

            {status === "mfa_required" ? (
              <div className="pt-2">
                {mfaSetupRequired ? (
                  <Suspense
                    fallback={
                      <div className="p-4 rounded-2xl border text-xs font-medium text-muted-foreground">
                        Chargement de la configuration MFA...
                      </div>
                    }
                  >
                    <MFASetupPage
                      embedded
                      ephemeralToken={ephemeralToken || undefined}
                      onComplete={handleMFAVerify}
                    />
                  </Suspense>
                ) : (
                  <MFAChallenge
                    method="totp"
                    error={error?.userMessage || error?.message}
                    isLoading={isLoading}
                    onVerify={handleMFAVerify}
                    onCancel={handleCancelMFA}
                  />
                )}
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                <div className="space-y-6">
                  <CustomInput
                    {...register("username")}
                    label="Identifiant"
                    placeholder="E-mail ou nom d'utilisateur"
                    icon={<Mail className="h-4 w-4" />}
                    error={errors.username?.message}
                    disabled={isLoading || isSubmitting}
                  />

                  <div className="space-y-2">
                    <CustomInput
                      {...register("password")}
                      type={showPassword ? "text" : "password"}
                      label="Mot de passe"
                      placeholder="Saisissez votre code"
                      icon={<Lock className="h-4 w-4" />}
                      error={errors.password?.message}
                      disabled={isLoading || isSubmitting}
                    />
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors pr-2"
                      >
                        {showPassword ? "Masquer" : "Afficher"}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center space-x-3">
                    <Controller
                      name="rememberMe"
                      control={control}
                      render={({ field }) => (
                        <Checkbox
                          id="rememberMe"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="h-5 w-5 rounded-md border-2"
                        />
                      )}
                    />
                    <label
                      htmlFor="rememberMe"
                      className="text-xs font-bold text-muted-foreground/80 cursor-pointer select-none"
                    >
                      Rester identifié
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-xs font-bold text-primary hover:text-primary/80 transition-colors"
                  >
                    Oublié ?
                  </button>
                </div>

                <CustomButton
                  isLoading={isSubmitting || isLoading}
                  disabled={!isServerOnline}
                >
                  Accéder au terminal{" "}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </CustomButton>
              </form>
            )}

            <div className="pt-8 flex flex-col items-center space-y-6">
              <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground/40 uppercase tracking-[0.3em]">
                <ShieldCheck className="h-3 w-3" />
                Accès hautement sécurisé
              </div>

              <div className="lg:hidden flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center p-1.5 grayscale opacity-50">
                  <img
                    src={Logo}
                    alt="Logo"
                    className="h-full w-full object-contain"
                  />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/30">
                  Rail Logistics
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


