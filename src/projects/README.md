# Project generator commands

This directory stores project manifests and project pages. Use the commands
below from the `rail-react/` root to scaffold project structure and register
model screens.

## Use `startapp` to scaffold a new project

Use `startapp` when you need a new project folder under `src/projects/`.

```bash
npm run startapp -- <project-id>
```

Example:

```bash
npm run startapp -- inventory
```

`startapp` creates:

- `src/projects/<project-id>/manifest.tsx`
- `src/projects/<project-id>/manifest.ts`
- `src/projects/<project-id>/config/routes.ts`
- starter pages in `src/projects/<project-id>/pages/`

## Use `register` to expose a model inside an existing project

Use `register` to expose one model table with form and detail routes in an
existing project manifest.

```bash
npm run register -- --model <app.model> --project <project-id> [options]
```

Minimum example:

```bash
npm run register -- --model catalog.article --project catalog
```

Inline table actions example:

```bash
npm run register -- --model operations.restitution --project operations --type inline --title "Restitutions"
```

Set sidebar position example:

```bash
npm run register -- --model catalog.article --project catalog --order 1
```

When registration succeeds, the command:

- creates three files under `src/projects/<project-id>/pages/<model-slug>/`
- adds route constants in `src/projects/<project-id>/config/routes.ts`
- adds route and navigation entries in `src/projects/<project-id>/manifest.tsx`
- keeps list route visible in sidebar
- keeps create, edit, and detail routes hidden in sidebar navigation

## `register` options

- `--model <app.model>`: Required model reference, for example
  `catalog.article`.
- `--project <project-id>`: Required target project under `src/projects/`.
- `--type <pages|inline>`: List behavior mode. Default is `pages`.
- `--title "<label>"`: Sidebar and table title.
- `--order <number>`: Sidebar position for the list entry. `1` inserts first.
- `--app <app>`: Optional app when `--model` does not include app prefix.
- `--slug <slug>`: Optional route segment and folder override.
- `--route-base </path>`: Optional route base override.
- `--icon <LucideIcon>`: Optional icon override. Default is `FileText`.
- `--description "<text>"`: Optional list description in manifest.
- `--form-title "<text>"`: Optional title used for form/detail route labels.
- `--permission <perm>`: Optional `requiredPermission` for generated routes.
- `--dry-run`: Preview file changes without writing files.
- `--force`: Overwrite generated files and conflicting route constants.

## Generated files for each model

For a model named `article`, the command creates:

- `src/projects/<project-id>/pages/article/ArticleListPage.tsx`
- `src/projects/<project-id>/pages/article/ArticleFormPage.tsx`
- `src/projects/<project-id>/pages/article/ArticleDetailPage.tsx`

This structure follows the same model folder pattern used by project pages such
as `src/projects/catalog/pages/article/`.
