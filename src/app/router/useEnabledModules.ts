import { useQuery, gql } from "@apollo/client";

const ENABLED_MODULES_QUERY = gql`
  query EnabledModules {
    enabledModules
  }
`;

export function useEnabledModules() {
  const { data, loading, error } = useQuery(ENABLED_MODULES_QUERY);
  
  return {
    modules: data?.enabledModules || [],
    isLoading: loading,
    error,
  };
}
