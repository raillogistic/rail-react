import React, { Suspense, lazy, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/shared/routing/routes";
import { useAuthContext } from "@/features/auth/context";
import { MFAChallenge } from "@/features/auth/components";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Mail,
  Lock,
  AlertTriangle,
  WifiOff,
  ArrowRight,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/shared/utils";
import {
  isServerOfflineError,
  onOfflineStatusChange,
  testServerConnectivity,
} from "@/shared/utils/legacy-utils/offline-detector";
import { BRANDING } from "@/shared/config/branding";
import Logo from "@/shared/assets/legacy-assets/logos/logo.png";

// UI Kit Imports
import { Button } from "@/shared/ui/kit/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/ui/kit/card";
import { Input } from "@/shared/ui/kit/input";
import { Label } from "@/shared/ui/kit/label";
import { Checkbox } from "@/shared/ui/kit/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/kit/alert";

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
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "", rememberMe: true },
  });

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
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-muted/30 p-4 font-sans">
      <div className="w-full max-w-[420px] space-y-8">
        {/* Brand Logo & Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="bg-primary/10 p-3 rounded-2xl mb-2">
            <img
              src={Logo}
              alt={BRANDING.productName}
              className="h-12 w-12 object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {status === "mfa_required" ? "Sécurité du compte" : "Connexion"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {status === "mfa_required"
              ? "Veuillez vérifier votre identité pour continuer"
              : "Accédez à votre espace collaborateur Patrimoin"}
          </p>
        </div>

        <Card className="border-none shadow-xl bg-card">
          <CardHeader className="space-y-1 pb-6">
            {!isServerOnline && (
              <Alert variant="destructive" className="mb-4">
                <WifiOff className="h-4 w-4" />
                <AlertTitle>Serveur hors-ligne</AlertTitle>
                <AlertDescription>
                  Impossible de contacter le serveur. Vérifiez votre connexion.
                </AlertDescription>
              </Alert>
            )}

            {error && status !== "mfa_required" && (
              <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Erreur d'authentification</AlertTitle>
                <AlertDescription>
                  {getAuthErrorMessage(error)}
                </AlertDescription>
              </Alert>
            )}
          </CardHeader>

          <CardContent>
            {status === "mfa_required" ? (
              <div className="space-y-4">
                {mfaSetupRequired ? (
                  <Suspense
                    fallback={
                      <div className="flex h-32 items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
                  <div className="space-y-4">
                    <div className="flex items-center justify-center p-4 bg-primary/5 rounded-full w-16 h-16 mx-auto mb-4">
                      <ShieldCheck className="h-8 w-8 text-primary" />
                    </div>
                    <MFAChallenge
                      method="totp"
                      error={getAuthErrorMessage(error)}
                      isLoading={isLoading}
                      onVerify={handleMFAVerify}
                      onCancel={handleCancelMFA}
                    />
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Identifiant</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="username"
                        {...register("username")}
                        placeholder="nom@entreprise.com"
                        className={cn("pl-9", errors.username && "border-destructive")}
                        disabled={isLoading || isSubmitting}
                        autoComplete="email"
                      />
                    </div>
                    {errors.username && (
                      <p className="text-xs font-medium text-destructive">
                        {errors.username.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Mot de passe</Label>
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-xs font-semibold"
                        onClick={() => navigate(ROUTES.FORGOT_PASSWORD)}
                        type="button"
                      >
                        Oublié ?
                      </Button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        {...register("password")}
                        placeholder="••••••••"
                        className={cn("pl-9", errors.password && "border-destructive")}
                        disabled={isLoading || isSubmitting}
                        autoComplete="current-password"
                      />
                    </div>
                    {errors.password && (
                      <p className="text-xs font-medium text-destructive">
                        {errors.password.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Controller
                    name="rememberMe"
                    control={control}
                    render={({ field }) => (
                      <Checkbox
                        id="rememberMe"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isLoading || isSubmitting}
                      />
                    )}
                  />
                  <Label
                    htmlFor="rememberMe"
                    className="text-sm font-medium leading-none cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Maintenir la connexion
                  </Label>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || isSubmitting || !isServerOnline}
                  className="w-full h-11 text-base font-semibold transition-all"
                >
                  {isLoading || isSubmitting ? (
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  ) : (
                    <>
                      Se connecter
                      <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </Button>
              </form>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 pt-2">
            <div className="text-center w-full">
              <p className="text-xs text-muted-foreground">
                &copy; {new Date().getFullYear()} {BRANDING.productName} — Système de Gestion du Patrimoine
              </p>
            </div>
          </CardFooter>
        </Card>

        {/* Technical Info */}
        <div className="flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(ROUTES.AUTH_ENDPOINT_CONFIG)}
            className="text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            Configuration réseau & points d'accès
          </Button>
        </div>
      </div>
    </div>
  );
};

