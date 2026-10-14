# Rail application

Copy `.env.example` to `.env`, set your Rail-Django backend endpoint, then run `npm run dev`.

Application code belongs in `src/`. Reusable source belongs in `rail/`.

```bash
npm run startapp -- inventory
npm run register -- --model catalog.article --project inventory
npm run shared:push -- "Improve table filtering"
npm run shared:pull
```

Commit or stash application changes before synchronization. Shared push commits only `rail/` changes. If dependency installation changes `package-lock.json`, commit that lockfile in this application afterward.

Keep model fields explicit in tables, forms, and details. The backend remains authoritative for permissions. Configure test credentials through `.env` and run `npm run test:all` for GraphQL changes.
