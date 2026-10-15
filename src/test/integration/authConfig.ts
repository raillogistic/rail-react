export interface IntegrationAuthConfig {
  username: string;
  password: string;
  endpoint: string;
}

type EnvSource = Record<string, string | undefined>;

const readEnvValue = (key: string, source?: EnvSource): string => {
  if (source) {
    const fromSource = source[key];
    return typeof fromSource === "string" ? fromSource.trim() : "";
  }

  const viteEnv = (import.meta.env as unknown as EnvSource)[key];
  if (typeof viteEnv === "string" && viteEnv.trim()) {
    return viteEnv.trim();
  }

  const processEnv = typeof process !== "undefined" ? process.env?.[key] : undefined;
  if (typeof processEnv === "string" && processEnv.trim()) {
    return processEnv.trim();
  }
  return "";
};

export const loadIntegrationAuthConfig = (source?: EnvSource): IntegrationAuthConfig => {
  const username = readEnvValue("VITE_TEST_USERNAME", source);
  const password = readEnvValue("VITE_TEST_PASSWORD", source);
  const endpoint = readEnvValue("VITE_TEST_GRAPHQL_ENDPOINT", source);

  const missing: string[] = [];
  if (!username) missing.push("VITE_TEST_USERNAME");
  if (!password) missing.push("VITE_TEST_PASSWORD");
  if (!endpoint) missing.push("VITE_TEST_GRAPHQL_ENDPOINT");

  if (missing.length > 0) {
    throw new Error(
      `Integration auth environment is incomplete. Missing: ${missing.join(", ")}`
    );
  }

  return { username, password, endpoint };
};
