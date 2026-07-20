# Project notes

## Dev workflow

- Do not run build checks (e.g. `ng build`, `npm run build`) if a dev server is already running — rely on the running dev server's compilation output instead.

## Database migrations

- Generate migrations with the TypeORM script, do not hand-write them. From `backend/`, run `npm run migrations:generate --name=<MigrationName>` (which diffs the entities against the DB). Use `npm run migrations:create --name=<MigrationName>` only when an empty migration is genuinely needed.
