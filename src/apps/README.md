# src/apps

This folder is for app/domain-specific pages and business logic (ex: products, clients, etc).

The reusable UI lives under `src/views`, `src/layout`, and `src/lib`.

## Local routes (ignored by git)

Create `src/apps/routes.local.ts` (gitignored) to register your app pages into the sidebar/router:

```ts
import type { NavigationSection } from "@/routes/links";

export const APP_DEFAULT_ROUTE = "/products";

export const APP_NAVIGATION_LINKS: NavigationSection[] = [
  // add your sections/items here
];
```
