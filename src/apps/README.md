# src/apps

This folder is for app/domain-specific pages and business logic (ex: products, clients, etc).

Reusable shared UI and infrastructure live under `src/lib` and `src/shared`.

## Local routes (ignored by git)

Create `src/apps/routes.local.ts` (gitignored) to register local-only routes
or manifest extensions for your environment:

```ts
import type { AppManifest } from "@/app/router/contracts";
import type { NavigationSection } from "@/app/router/navigation";

export const APP_MANIFEST: AppManifest = {
  projectId: "local",
  defaultRoute: "/products",
  routes: [],
  navigation: [],
};

// Legacy local shape is still accepted by localManifestExtension:
// export const APP_DEFAULT_ROUTE = "/products";
// export const APP_NAVIGATION_LINKS: NavigationSection[] = [];
```
