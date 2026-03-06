import { gql, useQuery } from "@apollo/client";
import { useMemo } from "react";

const MY_PERMISSIONS_QUERY = gql`
  query MyPermissions($modelName: String) {
    my_permissions: myPermissions(modelName: $modelName) {
      modelName: modelName
      verboseName: verboseName
      can_create: canCreate
      can_read: canRead
      can_update: canUpdate
      can_delete: canDelete
      can_list: canList
      can_history: canHistory
    }
  }
`;

export type ModelPermissions = {
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canList: boolean;
  canHistory: boolean;
  loading: boolean;
};

export type UseModelPermissionsOptions = {
  /** When true, skips the underlying permission query and returns falsy permissions. */
  skip?: boolean;
};

export function useModelPermissions(
  modelName: string,
  options?: UseModelPermissionsOptions,
): ModelPermissions {
  const shouldSkip = options?.skip ?? false;

  const { data, loading } = useQuery(MY_PERMISSIONS_QUERY, {
    variables: { modelName },
    fetchPolicy: "cache-first",
    skip: shouldSkip,
  });

  const permissions = useMemo(() => {
    if (!data?.my_permissions || data.my_permissions.length === 0) {
      return {
        canCreate: false,
        canRead: false,
        canUpdate: false,
        canDelete: false,
        canList: false,
        canHistory: false,
      };
    }

    // The backend returns a list, but filtering by modelName should give us the specific one.
    // However, if modelName is not provided, it returns all. Here we provided it.
    const perm = data.my_permissions.find(
      (p: {
        modelName: string;
        can_create: boolean;
        can_read: boolean;
        can_update: boolean;
        can_delete: boolean;
        can_list: boolean;
        can_history: boolean;
      }) => p.modelName.toLowerCase() === modelName.toLowerCase(),
    );

    if (!perm) {
      return {
        canCreate: false,
        canRead: false,
        canUpdate: false,
        canDelete: false,
        canList: false,
        canHistory: false,
      };
    }

    return {
      canCreate: perm.can_create ?? false,
      canRead: perm.can_read ?? false,
      canUpdate: perm.can_update ?? false,
      canDelete: perm.can_delete ?? false,
      canList: perm.can_list ?? false,
      canHistory: perm.can_history ?? false,
    };
  }, [data, modelName]);

  return { ...permissions, loading: shouldSkip ? false : loading };
}
