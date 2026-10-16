/** Narrow application extension points consumed by the shared Rail frontend. */
import type { ComponentType } from 'react';
import type { DocumentNode } from 'graphql';
import type { AppManifest, AppRouteConfig } from './router/contracts';
import type { AuthUser } from '@/features/auth/types';

/** Additional application checks are combined with Rail's own access checks. */
export interface ApplicationRouteAccess {
  isLoading: boolean;
  canAccessRoute: (route: AppRouteConfig) => boolean;
}

/** Configuration owned by each consuming application. */
export interface RailApplication {
  manifests?: AppManifest[];
  defaultRoute?: string;
  quickLogin?: { password: string };
  coreRoutes?: AppRouteConfig[];
  branding?: {
    productName?: string;
    productNameLong?: string;
    logo?: string;
    logoAlt?: string;
    description?: string;
    subtitle?: string;
  };
  auth?: {
    currentUserQuery?: DocumentNode;
    extendUser?: (user: AuthUser, rawUser: Record<string, unknown>) => AuthUser;
  };
  useRouteAccess?: () => ApplicationRouteAccess;
  slots?: {
    NewDocumentMenu?: ComponentType<{ compact?: boolean }>;
    Notifications?: ComponentType;
    AccountExtras?: ComponentType;
    AiSettings?: ComponentType;
  };
}
