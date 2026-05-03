# Frontend workspace

This folder contains the React frontend. It is based on the `rail-react`
starter and already includes generated model-driven UI patterns.

## Core responsibilities

Use this area for:

- project manifests and routes
- generated model list pages
- generated model form pages
- generated model detail pages and sections
- shared widgets, features, and API client code

## Generated model screens

The frontend already supports auto-generated screens for model-driven flows.

- Tables live through the model table widgets under `src/widgets/model-table/`.
- Forms live through the model form widgets under `src/widgets/model-form/`.
- Detail views live through the model details widgets under
  `src/widgets/model-details/`.

## Project scaffolding

Run these commands from `frontend/`:

```bash
npm run startapp -- <project-id>
npm run register -- --model <app.model> --project <project-id>
npm run unregister -- --model <app.model> --project <project-id>
```

Use them like this:

1. Run `npm run startapp -- <project-id>` to create a new project shell under
   `src/projects/`.
2. Run `npm run register -- --model <app.model> --project <project-id>` to add
   generated table, form, and detail pages for one backend model.
3. Adjust the generated pages and manifest when you need custom behavior.

## Documentation

Frontend implementation docs live under `frontend/docs/`.

Start with:

- [`docs/frontend/index.md`](./docs/frontend/index.md)
- [`src/projects/README.md`](./src/projects/README.md)
