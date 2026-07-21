# Project notes

## Dev workflow

- Do not run build checks (e.g. `ng build`, `npm run build`) if a dev server is already running — rely on the running dev server's compilation output instead.
- One warm dev server is shared across all agents. `npm run dev` (root) runs frontend + backend via `concurrently` and tees combined output to `dev.log` in the repo root. To check whether your change compiled or broke the app, read `dev.log` (e.g. `tail -n 80 dev.log`, or `grep '\[FE\]' dev.log` for Angular only) — do **not** start your own `ng serve`/dev server (the port is already in use and it just fragments the setup). Lines are prefixed `[FE]`/`[BE]`; the file contains raw ANSI color codes, so strip them when parsing. `dev.log` is gitignored.
- Because the server (and `dev.log`) is shared, an error in the log may originate from another agent's concurrent change, not yours. Before assuming your edit broke the build, check whether the failing file/area is one you touched; if not, it is likely someone else's in-flight work and will clear on its own.

## Frontend SDK

- The frontend SDK (`frontend/src/sdk`) is generated from the backend's OpenAPI spec — do **not** hand-edit `frontend/src/sdk/api.ts`. After changing a backend controller/DTO, regenerate it: from `frontend/`, run `npm run generate:sdk` (it reads the spec from the running backend at `http://127.0.0.1:3000/api/openapi-json`, so the dev server must be up). Every NestJS route needs a unique `operationId` (method name) or generation fails validation.

## Database migrations

- Generate migrations with the TypeORM script, do not hand-write them. From `backend/`, run `npm run migrations:generate --name=<MigrationName>` (which diffs the entities against the DB). Use `npm run migrations:create --name=<MigrationName>` only when an empty migration is genuinely needed.
