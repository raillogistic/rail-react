import React, { Suspense, lazy, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/shared/routing/routes";
import { useAuthContext } from "@/features/auth/context";
import { MFAChallenge } from "@/features/auth/components";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Mail,
  Lock,
  AlertTriangle,
  WifiOff,
  ArrowRight,
  Loader2,
  Check,
  Zap,
} from "lucide-react";
import { cn } from "@/shared/utils";
import {
  isServerOfflineError,
  onOfflineStatusChange,
  testServerConnectivity,
} from "@/shared/utils/legacy-utils/offline-detector";
import { BRANDING } from "@/shared/config/branding";
import Logo from "@/shared/assets/legacy-assets/logos/logo.png";

const loginSchema = z.object({
  username: z.string().min(1, "L'identifiant est requis"),
  password: z.string().min(1, "Le mot de passe est requis"),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

const MFASetupPage = lazy(() =>
  import("./MFASetupPage").then((module) => ({
    default: module.MFASetupPage,
  })),
);

// --- Corporate Neo-Brutalist Custom Inputs (Colorful) ---
const InputField = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & {
    icon: React.ReactNode;
    error?: string;
  }
>(({ className, icon, error, ...props }, ref) => (
  <div className="relative group">
    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-black z-10 transition-transform duration-200 group-focus-within:-rotate-6">
      {icon}
    </div>
    <input
      ref={ref}
      className={cn(
        "flex h-12 w-full border-2 border-black bg-white px-3 py-1 pl-10 text-sm text-black font-semibold shadow-[4px_4px_0_0_#000] focus:shadow-[0_0_0_0_#000] transition-all duration-200",
        "placeholder:text-zinc-500 placeholder:font-medium",
        "focus-visible:outline-none focus:translate-x-[4px] focus:translate-y-[4px] focus-visible:bg-[#c4b5fd]", // Soft purple on focus
        "disabled:cursor-not-allowed disabled:bg-zinc-100",
        error &&
          "bg-[#fca5a5] focus-visible:bg-[#fecaca] border-black shadow-[4px_4px_0_0_#b91c1c]",
        className,
      )}
      {...props}
    />
    {error && (
      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
        <AlertTriangle className="h-5 w-5 text-black" fill="#ef4444" />
      </div>
    )}
  </div>
));
InputField.displayName = "InputField";

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
  const [isServerOnline, setIsServerOnline] = useState(true);

  const getAuthErrorMessage = (authError: typeof error): string => {
    if (!authError) return "";
    const details = authError.details as { userMessage?: unknown } | undefined;
    if (
      typeof details?.userMessage === "string" &&
      details.userMessage.trim()
    ) {
      return details.userMessage;
    }
    return authError.message;
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "", rememberMe: true },
  });
  const rememberMe = watch("rememberMe");

  useEffect(() => {
    const checkConnectivity = async () =>
      setIsServerOnline(await testServerConnectivity());
    checkConnectivity();
    return onOfflineStatusChange((isOffline) => setIsServerOnline(!isOffline));
  }, []);

  useEffect(() => {
    if (error && isServerOfflineError(error)) {
      testServerConnectivity().then(setIsServerOnline);
    }
  }, [error]);

  const onSubmit = async (data: LoginFormData) => {
    try {
      clearError();
      await login(data);
      reset();
    } catch (e) {
      console.error(e);
    }
  };

  const handleMFAVerify = async (code: string) => {
    try {
      clearError();
      await verifyMFA(code);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCancelMFA = async () => {
    await logout();
    clearError();
  };

  return (
    <div className="h-[100dvh] w-full flex items-center justify-center bg-[#dbeafe] p-4 relative overflow-hidden font-sans">
      {/* Decorative CSS Styles */}
      <style>{`
        .bg-grid {
          background-size: 30px 30px;
          background-image: 
            linear-gradient(to right, rgba(0,0,0,0.07) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0,0,0,0.07) 1px, transparent 1px);
        }
        .star-shape {
          clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
        }
        .zigzag-shape {
          clip-path: polygon(0 20%, 20% 0, 40% 20%, 60% 0, 80% 20%, 100% 0, 100% 80%, 80% 100%, 60% 80%, 40% 100%, 20% 80%, 0 100%);
        }
        @keyframes subtle-float {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(5deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        @keyframes subtle-float-alt {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(15px) rotate(-5deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        .animate-subtle-float {
          animation: subtle-float 7s ease-in-out infinite;
        }
        .animate-subtle-float-alt {
          animation: subtle-float-alt 8s ease-in-out infinite;
        }
      `}</style>

      {/* Corporate Colorful Grid Background (Light Blue) */}
      <div className="absolute inset-0 bg-grid pointer-events-none"></div>

      {/* Pop-Art Colorful Elements */}
      <div className="absolute animate-subtle-float top-6 lg:top-12 left-6 lg:left-24 w-20 h-20 lg:w-32 lg:h-32 bg-[#f472b6] rounded-full border-2 border-black z-0 flex items-center justify-center shadow-[6px_6px_0_0_#000]"></div>
      <div
        className="absolute animate-subtle-float-alt top-24 lg:top-36 right-8 lg:right-32 w-16 h-16 lg:w-24 lg:h-24 bg-[#fde047] star-shape border-2 border-black z-0 shadow-[6px_6px_0_0_#000]"
        style={{ animationDelay: "1s" }}
      ></div>
      <div
        className="absolute animate-subtle-float bottom-10 lg:bottom-20 left-10 lg:left-40 w-20 h-10 lg:w-32 lg:h-16 bg-[#34d399] zigzag-shape border-2 border-black z-0 shadow-[6px_6px_0_0_#000] transform -rotate-12"
        style={{ animationDelay: "2s" }}
      ></div>
      <div
        className="absolute animate-subtle-float-alt bottom-20 lg:bottom-40 right-16 lg:right-48 w-12 h-12 bg-[#818cf8] border-2 border-black z-0 shadow-[4px_4px_0_0_#000] rotate-45"
        style={{ animationDelay: "0.5s" }}
      ></div>

      {/* Main Content Container */}
      <div className="w-full max-w-[400px] relative z-10 flex flex-col justify-center h-full max-h-[700px]">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-6 text-center animate-in fade-in duration-700">
          <div className="relative mb-4">
            <div className="h-16 w-16 bg-[#fcd34d] border-2 border-black shadow-[4px_4px_0_0_#000] flex items-center justify-center p-3 transform -rotate-2 hover:rotate-3 transition-transform">
              <img
                src={Logo}
                alt={BRANDING.productNameShort}
                className="w-full h-full object-contain filter drop-shadow opacity-95"
              />
            </div>
            {/* Minimal accent dot */}
            <div className="absolute -top-2 -right-2 w-5 h-5 bg-[#ec4899] border-2 border-black rounded-full shadow-[2px_2px_0_0_#000] animate-bounce"></div>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-black bg-white px-4 border-2 border-black shadow-[4px_4px_0_0_#000] transform -rotate-1 mb-2">
            {status === "mfa_required" ? "SÉCURITÉ" : "Bienvenue"}
          </h1>
          <div className="bg-[#4ade80] border-2 border-black px-3 py-1 shadow-[2px_2px_0_0_#000] transform rotate-1 inline-block mt-1">
            <p className="text-[12px] text-black font-bold uppercase tracking-wide">
              {status === "mfa_required"
                ? "Vérification requise"
                : "Espace Collaborateur"}
            </p>
          </div>
        </div>

        {/* Clean Colorful Brutalist Card */}
        <div className="bg-white border-2 border-black shadow-[8px_8px_0_0_#000] rounded-none p-6 sm:p-7 relative animate-in fade-in slide-in-from-bottom-8 duration-700 transform hover:-translate-y-1 transition-transform">
          <div className="relative z-10">
            {!isServerOnline && (
              <div className="mb-5 bg-[#fb923c] border-2 border-black p-3 flex items-center gap-3 text-black font-bold shadow-[4px_4px_0_0_#000]">
                <WifiOff className="h-5 w-5 shrink-0" />
                <p className="text-sm">Serveur hors-ligne</p>
              </div>
            )}

            {error && status !== "mfa_required" && (
              <div className="mb-5 bg-[#fca5a5] border-2 border-black p-3 flex items-start gap-3 text-black font-bold shadow-[4px_4px_0_0_#000] animate-in zoom-in-95">
                <AlertTriangle
                  className="h-6 w-6 shrink-0 mt-0.5"
                  fill="yellow"
                  stroke="black"
                />
                <p className="text-sm leading-snug">
                  {getAuthErrorMessage(error)}
                </p>
              </div>
            )}

            {status === "mfa_required" ? (
              <div className="bg-[#e2e8f0] border-2 border-black p-4 shadow-[4px_4px_0_0_#000]">
                {mfaSetupRequired ? (
                  <Suspense
                    fallback={
                      <div className="flex h-24 items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-black" />
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
                    error={getAuthErrorMessage(error)}
                    isLoading={isLoading}
                    onVerify={handleMFAVerify}
                    onCancel={handleCancelMFA}
                  />
                )}
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="space-y-4">
                  <div className="space-y-1.5 ">
                    <label className="text-xs font-bold uppercase text-black ml-1 tracking-wide bg-[#bae6fd] px-2 py-0.5 border-[1.5px] border-black shadow-[2px_2px_0_0_#000] inline-block">
                      Identifiant
                    </label>
                    <InputField
                      {...register("username")}
                      icon={<Mail className="h-4 w-4" />}
                      placeholder="nom@entreprise.com"
                      error={errors.username?.message}
                      disabled={isLoading || isSubmitting}
                      autoComplete="email"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between ml-1 pb-0.5">
                      <label className="text-xs font-bold uppercase text-black tracking-wide bg-[#fbcfe8] px-2 py-0.5 border-[1.5px] border-black shadow-[2px_2px_0_0_#000] inline-block">
                        Mot de passe
                      </label>
                      <button
                        type="button"
                        onClick={() => navigate(ROUTES.FORGOT_PASSWORD)}
                        className="text-[10px] font-bold uppercase text-black hover:bg-black hover:text-white border-[1.5px] border-transparent hover:border-black px-1.5 py-0.5 transition-colors"
                      >
                        Oublié ?
                      </button>
                    </div>
                    <InputField
                      {...register("password")}
                      type="password"
                      icon={<Lock className="h-4 w-4" />}
                      placeholder="••••••••"
                      error={errors.password?.message}
                      disabled={isLoading || isSubmitting}
                      autoComplete="current-password"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-1">
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={rememberMe}
                    onClick={() => setValue("rememberMe", !rememberMe)}
                    className={cn(
                      "peer h-6 w-6 shrink-0 border-2 border-black transition-all flex items-center justify-center cursor-pointer",
                      rememberMe
                        ? "bg-[#6366f1] text-white shadow-[2px_2px_0_0_#000] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
                        : "bg-white shadow-[2px_2px_0_0_#000] hover:bg-zinc-50 active:shadow-none active:translate-x-[2px] active:translate-y-[2px]",
                    )}
                  >
                    {rememberMe && (
                      <Check className="h-4 w-4" strokeWidth={4} />
                    )}
                  </button>
                  <label
                    className="text-xs font-bold text-zinc-800 cursor-pointer select-none hover:text-black hover:bg-[#fef08a] px-1 transition-colors leading-6"
                    onClick={() => setValue("rememberMe", !rememberMe)}
                  >
                    Maintenir la connexion
                  </label>
                </div>

                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={isLoading || isSubmitting || !isServerOnline}
                    className="group relative w-full flex items-center justify-center gap-2 h-14 bg-[#3b82f6] hover:bg-[#2563eb] text-white border-2 border-black shadow-[6px_6px_0_0_#000] font-black text-sm uppercase tracking-wider transition-all active:translate-x-[6px] active:translate-y-[6px] active:shadow-[0_0_0_0_#000] disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {isLoading || isSubmitting ? (
                      <Loader2 className="h-5 w-5 animate-spin text-white" />
                    ) : (
                      <>
                        <span className="drop-shadow-[1px_1px_0_#000]">
                          Se connecter
                        </span>
                        <ArrowRight className="h-5 w-5 drop-shadow-[1px_1px_0_#000] stroke-[3px] transition-transform duration-300 group-hover:translate-x-1" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Dynamic Footer */}
        <div className="mt-5 flex items-center justify-between px-1 text-xs text-black font-bold animate-in fade-in delay-500">
          <p className="bg-white border-2 border-black shadow-[2px_2px_0_0_#000] px-2 py-1 transform rotate-1">
            &copy; {new Date().getFullYear()} {BRANDING.productNameShort}
          </p>
          <button
            onClick={() => navigate(ROUTES.AUTH_ENDPOINT_CONFIG)}
            className="flex items-center gap-1.5 bg-[#fcd34d] border-2 border-black shadow-[2px_2px_0_0_#000] py-1 px-3 hover:bg-[#fbbf24] transition-colors active:translate-x-[2px] active:translate-y-[2px] active:shadow-[0_0_0_0_#000]"
          >
            <Zap className="h-3 w-3" />
            Réseau
          </button>
        </div>
      </div>
    </div>
  );
};
