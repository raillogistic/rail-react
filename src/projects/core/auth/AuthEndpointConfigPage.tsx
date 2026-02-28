import { useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/shared/ui/kit/button";
import { Input } from "@/shared/ui/kit/input";
import { Label } from "@/shared/ui/kit/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/kit/card";
import { toast } from "sonner";
import { ROUTES } from "@/shared/routing/routes";
import {
  clearBackendBaseOverride,
  getBackendBaseOverride,
  getRuntimeBackendConfig,
  setBackendBaseOverride,
} from "@/shared/config/backend-endpoint";

type BackendFormState = {
  protocol: "http" | "https";
  host: string;
  port: string;
};

/**
 * Parses a backend URL into editable form fields.
 */
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

/**
 * Builds a backend URL from form values.
 */
const buildBackendUrl = (state: BackendFormState): string => {
  const host = state.host.trim();
  const port = state.port.trim();
  const hostWithPort = port ? `${host}:${port}` : host;
  return `${state.protocol}://${hostWithPort}`;
};

/**
 * Auth page that lets users override backend host and port at runtime.
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

  /**
   * Handles save and persists user backend override.
   */
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
      toast.success(`Endpoint backend mis a jour: ${normalized}`);
      navigate(ROUTES.LOGIN, { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "URL backend invalide.";
      setErrorMessage(message);
    }
  };

  /**
   * Clears override and restores env-based backend defaults.
   */
  const handleReset = (): void => {
    clearBackendBaseOverride();
    const defaults = parseBackendUrlToFormState(getRuntimeBackendConfig().backendUrl);
    setFormState(defaults);
    setErrorMessage(null);
    toast.success("Configuration backend par defaut restauree.");
  };

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Configuration endpoint backend</CardTitle>
            <CardDescription>
              Definissez le host et le port backend utilises par les endpoints GraphQL/CSRF.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form className="space-y-4" onSubmit={handleSave}>
              <div className="grid gap-2">
                <Label htmlFor="backend-protocol">Protocol</Label>
                <select
                  id="backend-protocol"
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={formState.protocol}
                  onChange={(event) =>
                    setFormState((previous) => ({
                      ...previous,
                      protocol: event.target.value === "https" ? "https" : "http",
                    }))
                  }
                >
                  <option value="http">http</option>
                  <option value="https">https</option>
                </select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="backend-host">Host</Label>
                <Input
                  id="backend-host"
                  value={formState.host}
                  onChange={(event) =>
                    setFormState((previous) => ({ ...previous, host: event.target.value }))
                  }
                  placeholder="localhost"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="backend-port">Port</Label>
                <Input
                  id="backend-port"
                  value={formState.port}
                  onChange={(event) =>
                    setFormState((previous) => ({ ...previous, port: event.target.value }))
                  }
                  placeholder="8000"
                />
              </div>

              <div className="rounded-md border bg-slate-50 p-3 text-sm">
                <p>
                  <span className="font-semibold">Backend effectif:</span> {runtimeConfig.backendUrl}
                </p>
                <p>
                  <span className="font-semibold">API:</span> {runtimeConfig.apiEndpoint}
                </p>
                <p>
                  <span className="font-semibold">Auth:</span> {runtimeConfig.authEndpoint}
                </p>
                <p>
                  <span className="font-semibold">Apercu apres sauvegarde:</span>{" "}
                  {previewUrl || "-"}
                </p>
              </div>

              {errorMessage && (
                <p className="rounded-md border border-red-400 bg-red-50 p-2 text-sm text-red-700">
                  {errorMessage}
                </p>
              )}

              <div className="flex flex-wrap gap-2">
                <Button type="submit">Sauvegarder</Button>
                <Button type="button" variant="outline" onClick={handleReset}>
                  Reinitialiser
                </Button>
                <Button type="button" variant="secondary" onClick={() => navigate(ROUTES.LOGIN)}>
                  Retour login
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="text-sm">
          <Link className="text-blue-600 underline" to={ROUTES.LOGIN}>
            Aller a la page de connexion
          </Link>
        </div>
      </div>
    </div>
  );
}

