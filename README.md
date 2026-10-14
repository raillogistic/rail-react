# Rail React

Reusable React frontend for Rail-Django: authentication, layouts, themes, model tables, forms, details, and GraphQL utilities.

## Create directly from GitHub

Prerequisites: Node.js 20.19+, npm 10+, Git, configured Git author identity, and GitHub access. No local starter checkout is required.

```bash
npx --yes --package="git+https://github.com/raillogistic/rail-react.git#master" create-rail-app inventory
cd inventory
npm run dev
```

Creation refuses an existing destination. It creates an independent Git repository, a placeholder `.env`, and a `rail/` subtree fetched from GitHub, then installs dependencies. Configure the backend endpoint in `.env`. Add the new application's own GitHub repository as `origin` when ready; `rail` remains the shared-source remote.

## Submit and pull improvements

Edit reusable source inside `rail/`, then submit it from the application root:

```bash
npm run shared:push -- "Improve table filtering"
```

Commit or stash application-owned changes first. Push commits only `rail/`, merges upstream changes, installs dependencies, checks architecture, runs unit tests and the production build, then submits shared source. Run real-endpoint integration tests as well for GraphQL changes.

In another application:

```bash
npm run shared:pull
```

Pull requires a clean working tree and runs installation and the same checks. Commit `package-lock.json` in that application if installation changes it. Each application chooses when to update and deploy.

Conflicts stop synchronization without overwriting work or force-pushing. Resolve the files, stage them, and commit the merge before retrying; `git merge --abort` restores the preceding local state. Failed checks leave changes locally for repair. If another contributor updated GitHub during submission, pull and validate again before retrying.

## Application boundaries

- Local `src/` owns business pages, generated models, integration tests, branding, and backend configuration.
- `rail/` owns reusable source and dependencies, linked through the application's npm workspace.
- `src/application.ts` supplies manifests, branding, a default route, auth query/user mapping, additional route restrictions, and shell/settings integrations.
- Authentication defaults to the generic Rail-Django user contract. Additional checks can restrict access further; backend authorization remains authoritative.
- Existing imports such as `@/widgets/model-form` resolve into shared source; `@/projects/inventory/...` remains local.

The shared boundary check rejects application imports and generated backend types in reusable source. Keep field lists explicit in model tables, forms, and details. Never include credentials, real environment files, or business records in shared code.

## Add modules and model screens

```bash
npm run startapp -- inventory
npm run register -- --model catalog.article --project inventory
npm run unregister -- --model catalog.article --project inventory
```

Generators read the consuming application's backend settings and write into its source tree.

## Maintain the foundation

```bash
npm install
npm run dev
npm run test:unit
npm run test:commands
npm run check:architecture:full
npm run build
```

The repository runs standalone with generic core routes. Previous application examples remain recoverable in Git history; new consumers keep their business modules in their own repositories. No npm registry publication is needed.

Application startup calls `configureApplication(application)` before loading the shared root. Shared imports read a side-effect-free configuration object and never import application manifests themselves.
