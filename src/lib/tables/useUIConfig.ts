import { gql, useQuery, useMutation } from "@apollo/client";
import { useCallback, useMemo } from "react";

const GET_UI_CONFIG = gql`
  query GetUIConfig(
    $componentId: String!
    $page: Int
    $perPage: Int
    $orderBy: [String!]
  ) {
    uicomponentconfigs_pages: uiComponentConfigsPages(
      page: $page
      perPage: $perPage
      orderBy: $orderBy
      filters: { component_id__exact: $componentId }
    ) {
      items {
        id
        component_id: componentId
        configuration
        is_global: isGlobal
        users {
          id
          username
        }
      }
    }
  }
`;

const CREATE_UI_CONFIG = gql`
  mutation CreateUIConfig($input: CreateUIComponentConfigInput!) {
    create_uicomponentconfig: createUiComponentConfig(input: $input) {
      object {
        id
        configuration
      }
    }
  }
`;

const UPDATE_UI_CONFIG = gql`
  mutation UpdateUIConfig($input: UpdateUIComponentConfigInput!) {
    update_uicomponentconfig: updateUiComponentConfig(input: $input) {
      object {
        id
        configuration
      }
    }
  }
`;

export type UIConfigState = {
  columnVisibility?: string[];
  columnOrder?: string[];
  // Add other config keys here (e.g. density, sorting)
};

const DEFAULT_COMPONENT_TYPE = "TABLE" as const;

export function useUIConfig(componentId: string, userId?: string) {
  const { data, loading, refetch } = useQuery(GET_UI_CONFIG, {
    variables: { componentId, page: 1, perPage: 20, orderBy: ["-updated_at"] },
    skip: !componentId,
    fetchPolicy: "network-only", // Ensure we get fresh data
  });

  const [createConfig] = useMutation(CREATE_UI_CONFIG);
  const [updateConfig] = useMutation(UPDATE_UI_CONFIG);

  const configs = useMemo(() => {
    return data?.uicomponentconfigs_pages?.items || [];
  }, [data]);

  // Find user-specific config, or fallback to global
  const activeConfig = useMemo(() => {
    if (!configs.length) return null;
    // If userId is provided, try to find exact match
    if (userId) {
      const userConfig = configs.find((c: any) => c.users?.id === userId);
      if (userConfig) return userConfig;
    }
    // Fallback to global config if no user config found (or no userId provided)
    // We prefer the one with isGlobal=true
    return configs.find((c: any) => c.is_global) || null;
  }, [configs, userId]);

  const saveConfig = useCallback(
    async (newConfig: UIConfigState) => {
      if (!userId) {
        console.warn("Cannot save UI config without userId");
        return;
      }

      // Check if we already have a config for this user
      const userConfig = configs.find((c: any) => c.users?.id === userId);

      try {
        if (userConfig) {
          await updateConfig({
            variables: {
              input: {
                id: userConfig.id,
                configuration: newConfig,
              },
            },
          });
        } else {
          await createConfig({
            variables: {
              input: {
                componentId,
                componentType: DEFAULT_COMPONENT_TYPE,
                configuration: newConfig,
                user: userId, // This might need to be passed differently depending on API
                isGlobal: false,
              },
            },
          });
        }
        refetch();
      } catch (error) {
        console.error("Failed to save UI config:", error);
      }
    },
    [configs, userId, componentId, createConfig, updateConfig, refetch]
  );

  return {
    config: activeConfig?.configuration as UIConfigState | null,
    loading,
    saveConfig,
  };
}
