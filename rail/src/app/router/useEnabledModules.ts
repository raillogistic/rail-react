export function useEnabledModules() {
  return {
    modules: ["core", "purchasing", "inventory", "sales", "finance", "hr", "crm"],
    isLoading: false,
    error: undefined,
  };
}
