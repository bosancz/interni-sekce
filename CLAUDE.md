# Project notes

## Commits & changelog

- **Always commit in [Conventional Commits](https://www.conventionalcommits.org/) format** (`type(scope): description`, e.g. `feat(gallery): přidání štítků k fotkám`, `fix: oprava iniciál v avataru`). commitlint (`@commitlint/config-conventional`) is installed for this reason.
- **Write the `description` in Czech.** The visitor-facing changelog is generated straight from commit subjects (`feat` → *Novinky*, `fix` → *Opravy*), so a Czech description gives a legible changelog. Keep the `type`/`scope` in English (they must match commitlint and the generator's parser).
- `CHANGELOG.md` (repo root) is regenerated and committed automatically on Release-to-PROD by `.github/workflows/changelog.yml` (via `scripts/generate-changelog.mjs`), which **prepends** the new version's section — so manual edits to older sections are preserved. Only `feat`/`fix` reach the changelog; other types (`chore`/`docs`/`refactor`/…) are omitted. The backend serves the file at `GET /api/changelog`, and clicking the version in the menu shows it.

## Dev workflow

- Do not run build checks (e.g. `ng build`, `npm run build`) if a dev server is already running — rely on the running dev server's compilation output instead.
- One warm dev server is shared across all agents. `npm run dev` (root) runs frontend + backend via `concurrently` and tees combined output to `dev.log` in the repo root. To check whether your change compiled or broke the app, read `dev.log` (e.g. `tail -n 80 dev.log`, or `grep '\[FE\]' dev.log` for Angular only) — do **not** start your own `ng serve`/dev server (the port is already in use and it just fragments the setup). Lines are prefixed `[FE]`/`[BE]`; the file contains raw ANSI color codes, so strip them when parsing. `dev.log` is gitignored.
- **No `dev.log` (or a stale one) means no server is running — you are in a fresh cloud/sandbox session and are expected to start one yourself so you can actually verify your change.** The "don't start your own server" rule above only prevents fragmenting an *already-running* shared server; it is **not** licence to ship unverified. Bring the server up (backgrounded) and then read `dev.log` exactly as above:
  - There is no committed lockfile, so install with `npm install`, **not** `npm ci` / `npm run install` (both run `npm ci`, which fails without a lockfile). Install in whichever of `frontend/` and `backend/` you touched. Don't commit the `package-lock.json` this creates.
  - A **frontend-only** change does not need the database — the fastest check is `cd frontend && npm install && npm run dev` and reading its Angular compile output.
  - For a **backend** change, or to run the full root `npm run dev` (which is what produces `dev.log`), first bring up Postgres and export the `DB_*` vars — see [Running Postgres in a cloud/sandbox session](#running-postgres-in-a-cloudsandbox-session-no-db-already-up) below.
- Because the server (and `dev.log`) is shared, an error in the log may originate from another agent's concurrent change, not yours. Before assuming your edit broke the build, check whether the failing file/area is one you touched; if not, it is likely someone else's in-flight work and will clear on its own.

## Frontend SDK

- The frontend SDK (`frontend/src/sdk`) is generated from the backend's OpenAPI spec — do **not** hand-edit `frontend/src/sdk/api.ts`. After changing a backend controller/DTO, regenerate it: from `frontend/`, run `npm run generate:sdk` (it reads the spec from the running backend at `http://127.0.0.1:3000/api/openapi-json`, so the dev server must be up). Every NestJS route needs a unique `operationId` (method name) or generation fails validation.

## Backend entities

- **One table, one entity mapping.** Never map the same table twice (e.g. an explicit `@Entity("x")` *and* a `@ManyToMany`/`@JoinTable` over `"x"`). TypeORM then builds two metadata objects for it, and the schema builder drops and recreates that table's indexes in **every** generated migration — permanent drift that survives being applied. `events_groups` was in this state for years (an `EventGroup` entity next to `Event`'s `@JoinTable`); it is now mapped **only** by the `@ManyToMany`/`@JoinTable` on `Event.groups`, and must not get an entity of its own again.
- **Join tables without an entity are addressed by name.** `events_groups` has no `EntityTarget`, so anything that needs to touch it directly works off the table name — see `clearJoinTable()` in `mongo-import.service.ts`. Reads and writes otherwise go through `Event.groups`.
- **`Event.groupsIds` is a `@RelationId`, so it is read-only.** It populates on any query shape without needing a join, but writes have to go through the relation: `EventsRepository.updateEvent()` turns `groupsIds` into `groups` references and lets the cascading `save()` sync the join rows. Setting `groupsIds` alone does nothing.

## Database migrations

- **Always** produce migrations with `npm run migrations:generate --name=<MigrationName>` (from `backend/`), never by hand and never with `migrations:create`. The generator diffs the entities against the DB, so the migration comes out in TypeORM's own format and naming — hand-written files drift from that shape.
- This means schema changes are driven **from the entities**: change the `@Column`/`@Entity` definition first (including options like `collation`, `type`, `nullable`, indexes), then generate. If you find yourself wanting to write SQL by hand, model it on the entity instead and let the generator emit it.
- **Always read and fix up the generated migration before running it** — generation is a starting point, not the finished artifact. Check for all of:
  - **Unrelated drift.** The diff compares *all* entities against the DB, so it happily sweeps in changes you did not intend — indexes/columns from someone else's in-flight entity edits, or divergence that was already there. Delete those statements (from both `up()` and `down()`) so the migration only contains the change you meant to make.
  - **Statements TypeORM cannot generate.** A few DB objects have no entity representation (`CREATE COLLATION`, extensions, functions), so the generator emits code that references them without creating them — which fails on a fresh DB or in production. Add those statements by hand, ahead of the statement that depends on them; see `*-GroupNameNaturalNumericCollation.ts`, which creates the `natural_numeric` ICU collation before the column starts using it.
  - **That `down()` really reverses `up()`**, including any statements you added or removed by hand.
- **Generated columns must be registered in `typeorm_metadata`.** TypeORM stores the `asExpression` of every `generatedType: "STORED"` column in the `typeorm_metadata` table and compares against it on each generate. If a migration adds the column with raw `ALTER TABLE ... GENERATED ALWAYS AS (...)` but skips the metadata row, **every** later `migrations:generate` will try to drop and recreate the column — permanent drift. Pair each `ADD` with the matching `INSERT INTO "typeorm_metadata" (...)` (and each `DROP` with a `DELETE`), exactly as the generator emits it — **except** use `current_database()` for the `database` value instead of the hardcoded DB name the generator bakes in, or it won't match in production. See `*-SearchVectorColumns.ts` (the `search_vector` full-text columns): it also creates the `unaccent` extension and a `simple_unaccent` text-search configuration ahead of the columns (both have no entity representation), and — since TypeORM can't express `USING gin (...)` — declares the GIN index on the entity with `@Index("…", { synchronize: false })` and creates/drops it by hand in the migration.
- **Full-text search uses `search_vector` tsvector columns.** Each searchable entity (members, events, albums, users) has a stored generated `search_vector` built with `to_tsvector('simple_unaccent', …)` (the 2-arg form is IMMUTABLE, so it is legal in a STORED column — unlike the STABLE built-in `unaccent()`). The `simple_unaccent` config = `simple` (lowercase, no stemming/stopwords) with its word tokens remapped through `unaccent`, giving case- and diacritic-insensitive matching. Query it with `search_vector @@ to_tsquery('simple_unaccent', :q)`, building `:q` via `toPrefixTsQuery()` in `helpers/search.ts` (splits input, strips tsquery operators, adds `:*` prefix, ANDs tokens). This matches whole words and prefixes, any order — **not** arbitrary substrings (mid-word `opeč`→`Kopeček` will not match; that would need a `pg_trgm` GIN trigram index on a plain text column instead).
- Then apply it and confirm it actually works, rather than assuming — run `migrations:run`, and check the resulting schema/data (e.g. query `information_schema.columns`). `migrations:revert` is a cheap way to verify both directions. After applying, run `migrations:generate` once more: a clean change reports *"No changes in database schema were found"* — anything else is drift to fix before committing.
- Migrations auto-run in production only (`migrationsRun` in `config.ts`); in dev, apply them yourself with `npm run migrations:run` (`migrations:revert` undoes the last one).

### Running Postgres in a cloud/sandbox session (no DB already up)

Web/sandbox sessions start with no database — the dev server and `migrations:*` commands need one. Postgres 16 is preinstalled but the client-facing config points at `localhost:5432`, so spin up a local cluster and export the `DB_*` vars. It **cannot run as root**; use the preexisting unprivileged `postgres` system user.

```bash
PGBIN=/usr/lib/postgresql/16/bin
PGDATA=/tmp/pgdata; rm -rf "$PGDATA"; mkdir -p "$PGDATA"; chown postgres:postgres "$PGDATA" /tmp
su postgres -c "$PGBIN/initdb -D $PGDATA -U postgres --auth=trust"
su postgres -c "$PGBIN/pg_ctl -D $PGDATA -o '-p 5432 -k /tmp -c listen_addresses=127.0.0.1' -l /tmp/pg.log start"
# App DB + the extensions the entities need (PostGIS for Event.placeGeometry):
PGPASSWORD=postgres psql -h 127.0.0.1 -U postgres -c "CREATE DATABASE interni;"
PGPASSWORD=postgres psql -h 127.0.0.1 -U postgres -d interni -c "CREATE EXTENSION IF NOT EXISTS postgis;"
```

- **PostGIS** is not preinstalled; if `CREATE EXTENSION postgis` fails, `apt-get update && apt-get install -y postgresql-16-postgis-3` (the initial `apt-get update` is needed — the stale index 404s otherwise). `unaccent` ships with core.
- Point the tooling at this cluster with the `DB_*` env vars from `config.ts`, then run migrations from `backend/`:
  ```bash
  export DB_HOST=127.0.0.1 DB_PORT=5432 DB_USER=postgres DB_PASSWORD=postgres DB_DATABASE_NAME=interni DB_SCHEMA=public
  npm install && npm run migrations:run
  ```
- Dependencies may be uninstalled too — use `npm install` (there is no committed lockfile, so `npm ci` fails). Don't commit the `package-lock.json` it creates.
