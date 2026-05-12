import { useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ROUTES } from "@/shared/routing/routes";
import {
  clearBackendBaseOverride,
  getBackendBaseOverride,
  getRuntimeBackendConfig,
  setBackendBaseOverride,
} from "@/shared/config/backend-endpoint";
import {
  ArrowLeft,
  Save,
  RefreshCw,
  Server,
  Settings2,
  Globe,
  CheckCircle2,
} from "lucide-react";
import Logo from "@/shared/assets/legacy-assets/logos/logo.png";
import { BRANDING } from "@/shared/config/branding";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/kit/select";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/kit/alert";

type BackendFormState = {
  protocol: "http" | "https";
  host: string;
  port: string;
};

const parseBackendUrlToFormState = (value: string): BackendFormState => {
  try {
    const parsed = new URL(value);
    return {
      protocol: parsed.protocol === "https:" ? "https" : "http",
      host: parsed.hostname,
      port: parsed.port,
    };
  } catch {
    return {
      protocol: "http",
      host: "localhost",
      port: "8000",
    };
  }
};

const buildBackendUrl = (state: BackendFormState): string => {
  const host = state.host.trim();
  const port = state.port.trim();
  const hostWithPort = port ? `${host}:${port}` : host;
  return `${state.protocol}://${hostWithPort}`;
};

/**
 * Auth page that lets users override backend host and port at runtime.
 * Unified with the Premium Modern ERP theme.
 */
export function AuthEndpointConfigPage() {
  const navigate = useNavigate();
  const runtimeConfig = getRuntimeBackendConfig();
  const savedOverride = getBackendBaseOverride();
  const [formState, setFormState] = useState<BackendFormState>(
    parseBackendUrlToFormState(savedOverride ?? runtimeConfig.backendUrl),
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const previewUrl = useMemo(() => {
    try {
      return buildBackendUrl(formState);
    } catch {
      return "";
    }
  }, [formState]);

  const handleSave = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    setErrorMessage(null);

    if (!formState.host.trim()) {
      setErrorMessage("Le host backend est requis.");
      return;
    }

    try {
      const nextBackendUrl = buildBackendUrl(formState);
      const normalized = setBackendBaseOverride(nextBackendUrl);
      toast.success(`Endpoint backend mis à jour: ${normalized}`);
      navigate(ROUTES.LOGIN, { replace: true });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "URL backend invalide.";
      setErrorMessage(message);
    }
  };

  const handleReset = (): void => {
    clearBackendBaseOverride();
    const defaults = parseBackendUrlToFormState(
      getRuntimeBackendConfig().backendUrl,
    );
    setFormState(defaults);
    setErrorMessage(null);
    toast.success("Configuration backend par défaut restaurée.");
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-muted/30 p-4 font-sans">
      <div className="w-full max-w-[480px] space-y-8">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="bg-primary/10 p-3 rounded-2xl mb-2 cursor-pointer hover:bg-primary/20 transition-colors" onClick={() => navigate(ROUTES.LOGIN)}>
            <img
              src={Logo}
              alt="Logo"
              className="h-10 w-10 object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Configuration Réseau
          </h1>
          <p className="text-muted-foreground text-sm">
            Personnalisez l'adresse du serveur backend pour cet appareil
          </p>
        </div>

        <Card className="border-none shadow-xl bg-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              Paramètres de l'API
            </CardTitle>
            <CardDescription>
              Modifiez les réglages si vous utilisez un serveur de développement ou un proxy spécifique.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form id="endpoint-form" onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 gap-4">
                {/* Protocol */}
                <div className="space-y-2">
                  <Label htmlFor="protocol">Protocole</Label>
                  <Select
                    value={formState.protocol}
                    onValueChange={(val: "http" | "https") =>
                      setFormState((prev) => ({ ...prev, protocol: val }))
                    }
                  >
                    <SelectTrigger id="protocol">
                      <SelectValue placeholder="Sélectionnez un protocole" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="http">HTTP (Non sécurisé)</SelectItem>
                      <SelectItem value="https">HTTPS (Sécurisé)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Host */}
                <div className="space-y-2">
                  <Label htmlFor="host">Hôte (Domaine ou IP)</Label>
                  <div className="relative">
                    <Server className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="host"
                      className="pl-9"
                      value={formState.host}
                      onChange={(e) =>
                        setFormState((p) => ({ ...p, host: e.target.value }))
                      }
                      placeholder="ex: api.patrimoin.com ou 192.168.1.50"
                    />
                  </div>
                </div>

                {/* Port */}
                <div className="space-y-2">
                  <Label htmlFor="port">Port</Label>
                  <div className="relative">
                    <Settings2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="port"
                      className="pl-9"
                      value={formState.port}
                      onChange={(e) =>
                        setFormState((p) => ({ ...p, port: e.target.value }))
                      }
                      placeholder="ex: 8000"
                    />
                  </div>
                </div>
              </div>

              {/* URL Preview */}
              <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground font-medium uppercase tracking-wider">Configuration Actuelle</span>
                  <span className="font-mono bg-background px-2 py-0.5 rounded border">{runtimeConfig.backendUrl}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground font-semibold uppercase tracking-wider text-[10px]">Nouvelle Destination</span>
                  <span className="font-mono text-primary font-bold">{previewUrl || "---"}</span>
                </div>
              </div>

              {errorMessage && (
                <Alert variant="destructive">
                  <AlertTitle>Erreur de configuration</AlertTitle>
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              )}
            </form>
          </CardContent>

          <CardFooter className="flex flex-col gap-3 border-t bg-muted/20 py-6">
            <div className="grid grid-cols-2 gap-3 w-full">
              <Button
                type="submit"
                form="endpoint-form"
                className="w-full font-semibold"
              >
                <Save className="h-4 w-4 mr-2" />
                Appliquer
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(ROUTES.LOGIN)}
                className="w-full font-semibold"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
            </div>
            
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="w-full text-xs text-muted-foreground hover:text-destructive transition-colors"
            >
              <RefreshCw className="h-3 w-3 mr-2" />
              Réinitialiser les paramètres d'usine
            </Button>
          </CardFooter>
        </Card>

        {/* Footer Info */}
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-[0.2em] bg-background border px-3 py-1 rounded-full shadow-sm">
            <CheckCircle2 className="h-3 w-3 text-primary" />
            Console Réseau — {BRANDING.productName}
          </div>
          <p className="text-[10px] text-muted-foreground">
            &copy; {new Date().getFullYear()} {BRANDING.productName} • Sécurité & Infrastructure
          </p>
        </div>
      </div>
    </div>
  );
}
