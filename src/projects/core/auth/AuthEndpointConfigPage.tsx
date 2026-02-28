import { useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/shared/ui/kit/input";
import { Label } from "@/shared/ui/kit/label";
import { toast } from "sonner";
import { ROUTES } from "@/shared/routing/routes";
import {
  clearBackendBaseOverride,
  getBackendBaseOverride,
  getRuntimeBackendConfig,
  setBackendBaseOverride,
} from "@/shared/config/backend-endpoint";
import {
  Zap,
  ArrowLeft,
  Save,
  RefreshCw,
  Server,
  Settings2,
} from "lucide-react";
import Logo from "@/shared/assets/legacy-assets/logos/logo.png";
import { BRANDING } from "@/shared/config/branding";

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
 * Unified with the corporate neo-brutalist theme of the LoginPage.
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
    <div className="h-[100dvh] w-full flex items-center justify-center bg-[#dbeafe] p-4 relative overflow-hidden font-sans">
      <style>{`
        .bg-grid {
          background-size: 30px 30px;
          background-image: 
            linear-gradient(to right, rgba(0,0,0,0.07) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0,0,0,0.07) 1px, transparent 1px);
        }
        @keyframes subtle-float {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(5deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        .animate-subtle-float {
          animation: subtle-float 7s ease-in-out infinite;
        }
      `}</style>

      {/* Corporate Grid Background */}
      <div className="absolute inset-0 bg-grid pointer-events-none"></div>

      {/* Decorative Elements */}
      <div className="absolute animate-subtle-float top-12 left-12 w-24 h-24 bg-[#fde047] rounded-full border-2 border-black z-0 shadow-[6px_6px_0_0_#000]"></div>
      <div className="absolute animate-subtle-float bottom-12 right-12 w-32 h-16 bg-[#34d399] border-2 border-black z-0 shadow-[6px_6px_0_0_#000] rotate-12"></div>

      <div className="w-full max-w-[450px] relative z-10 flex flex-col justify-center h-full max-h-[850px]">
        {/* Header */}
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="relative mb-4">
            <div className="h-16 w-16 bg-[#fcd34d] border-2 border-black shadow-[4px_4px_0_0_#000] flex items-center justify-center p-3 transform -rotate-2">
              <img
                src={Logo}
                alt="Logo"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-black bg-white px-4 py-1 border-2 border-black shadow-[4px_4px_0_0_#000] transform -rotate-1 mb-2 uppercase">
            Configuration Réseau
          </h1>
          <div className="bg-[#818cf8] border-2 border-black px-3 py-1 shadow-[2px_2px_0_0_#000] transform rotate-1 inline-block">
            <p className="text-[10px] text-white font-bold uppercase tracking-widest">
              Paramètres de l'Endpoint Backend
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white border-2 border-black shadow-[8px_8px_0_0_#000] p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <form className="space-y-6" onSubmit={handleSave}>
            <div className="space-y-4">
              {/* Protocol */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-black ml-1 tracking-wide bg-[#bae6fd] px-2 py-0.5 border-[1.5px] border-black shadow-[2px_2px_0_0_#000] inline-block">
                  Protocole
                </Label>
                <select
                  id="backend-protocol"
                  className="flex h-12 w-full border-2 border-black bg-white px-3 py-1 text-sm text-black font-semibold shadow-[4px_4px_0_0_#000] focus:shadow-none transition-all focus:translate-x-[4px] focus:translate-y-[4px] focus:bg-[#bae6fd] outline-none"
                  value={formState.protocol}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      protocol:
                        event.target.value === "https" ? "https" : "http",
                    }))
                  }
                >
                  <option value="http">HTTP</option>
                  <option value="https">HTTPS</option>
                </select>
              </div>

              {/* Host */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-black ml-1 tracking-wide bg-[#fbcfe8] px-2 py-0.5 border-[1.5px] border-black shadow-[2px_2px_0_0_#000] inline-block">
                  Hôte
                </Label>
                <div className="relative">
                  <Server className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-black z-10" />
                  <Input
                    id="backend-host"
                    className="h-12 border-2 border-black bg-white pl-10 text-sm font-semibold shadow-[4px_4px_0_0_#000] focus:shadow-none focus:translate-x-[4px] focus:translate-y-[4px] focus-visible:bg-[#fbcfe8] transition-all rounded-none"
                    value={formState.host}
                    onChange={(e) =>
                      setFormState((p) => ({ ...p, host: e.target.value }))
                    }
                    placeholder="localhost"
                  />
                </div>
              </div>

              {/* Port */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-black ml-1 tracking-wide bg-[#fef08a] px-2 py-0.5 border-[1.5px] border-black shadow-[2px_2px_0_0_#000] inline-block">
                  Port
                </Label>
                <div className="relative">
                  <Settings2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-black z-10" />
                  <Input
                    id="backend-port"
                    className="h-12 border-2 border-black bg-white pl-10 text-sm font-semibold shadow-[4px_4px_0_0_#000] focus:shadow-none focus:translate-x-[4px] focus:translate-y-[4px] focus-visible:bg-[#fef08a] transition-all rounded-none"
                    value={formState.port}
                    onChange={(e) =>
                      setFormState((p) => ({ ...p, port: e.target.value }))
                    }
                    placeholder="8000"
                  />
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="bg-zinc-50 border-2 border-black border-dashed p-4 text-[11px] font-bold leading-relaxed">
              <p className="flex justify-between border-b border-black/10 pb-1 mb-1">
                <span className="text-zinc-500 uppercase">Actuel</span>
                <span>{runtimeConfig.backendUrl}</span>
              </p>
              <p className="flex justify-between text-[#3b82f6]">
                <span className="uppercase">Nouvel Endpoint</span>
                <span>{previewUrl || "-"}</span>
              </p>
            </div>

            {errorMessage && (
              <div className="bg-[#fca5a5] border-2 border-black p-2 text-xs font-black shadow-[4px_4px_0_0_#000]">
                {errorMessage}
              </div>
            )}

            <div className="space-y-3 pt-2">
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 h-12 bg-[#3b82f6] text-white border-2 border-black shadow-[4px_4px_0_0_#000] font-black text-xs uppercase tracking-widest transition-all active:translate-x-[4px] active:translate-y-[4px] active:shadow-none"
              >
                <Save className="h-4 w-4" />
                Sauvegarder
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex items-center justify-center gap-2 h-10 bg-[#f472b6] text-white border-2 border-black shadow-[4px_4px_0_0_#000] font-black text-[10px] uppercase transition-all active:translate-x-[4px] active:translate-y-[4px] active:shadow-none"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() => navigate(ROUTES.LOGIN)}
                  className="flex items-center justify-center gap-2 h-10 bg-white text-black border-2 border-black shadow-[4px_4px_0_0_#000] font-black text-[10px] uppercase transition-all active:translate-x-[4px] active:translate-y-[4px] active:shadow-none"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Annuler
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-6 flex flex-col items-center gap-3">
          <div className="flex items-center gap-2 bg-black text-white px-3 py-1 shadow-[4px_4px_0_0_#3b82f6]">
            <Zap className="h-3 w-3 text-yellow-400" />
            <span className="text-[10px] font-black uppercase tracking-tighter">
              Rail Corporate Network Console v1.0
            </span>
          </div>
          <p className="text-[10px] font-bold text-black opacity-60">
            &copy; {new Date().getFullYear()} {BRANDING.productName} • Sécurité
            Opérationnelle
          </p>
        </div>
      </div>
    </div>
  );
}
