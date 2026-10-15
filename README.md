# Rail application

Copy `.env.example` to `.env`, set your Rail-Django backend endpoint, then run `npm run dev`.

Application code belongs in `src/`. Reusable source belongs in `rail/`.

```bash
npm run startapp -- inventory
npm run register -- --model catalog.article --project inventory
npm run shared:push -- "Improve table filtering"
npm run shared:pull
npm run shared:pull -- v2
npm run shared:pull -- --list
```

Push automatically publishes the next shared version (`v1`, `v2`, ...), after checks pass. Pull without a version gets the latest release; supplying a version selects that release, including an older one. `--list` shows available versions. No patch/minor/major decision is required.

Commit or stash application changes before synchronization. Shared push commits only `rail/` changes. Both commands install dependencies, check architecture, run unit tests, and build. If dependency installation changes `package-lock.json`, commit that lockfile in this application afterward. Conflicts or failed checks stop the command and preserve local work; failed checks do not undo an already completed merge. See `rail/README.md` for recovery. Test important application flows before deploying.

Keep model fields explicit in tables, forms, and details. The backend remains authoritative for permissions. Configure test credentials through `.env` and run `npm run test:all` for GraphQL changes.
