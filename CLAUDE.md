# Project notes

## Commits & changelog

- **Commit in [Conventional Commits](https://www.conventionalcommits.org/) format** (`type(scope): description`) — commitlint (`@commitlint/config-conventional`) enforces it. **Write the description in Czech**, `type`/`scope` in English: the visitor-facing changelog takes commit subjects **verbatim**, so the subject you write is the line visitors read.
- **An issue reaches the changelog only if the commit itself references it** — `Closes #123` (also `Fixes`/`Resolves`/`Refs`) in the commit *body*, or `(#123)` in the subject. Merge commits are excluded (`--no-merges`) and PR bodies are not part of git history, so a reference living only in the PR does not count.
- `scripts/generate-changelog.mjs` **prepends** the new version's section to `CHANGELOG.md`, so manual edits to older sections survive. Every conventional type reaches it (only merges and non-conventional subjects are dropped); a version is one flat list, each entry labelled and ordered by its type's gitmoji: `feat` ✨, `fix` 🐛, `style` 🎨, `perf` ⚡️, `refactor` ♻️, `docs` 📝, `test` ✅, `build` 📦️, `ci` 👷, `revert` ⏪️, `chore` 🔧. The backend serves the file at `GET /api/changelog`; clicking the version in the menu shows it.
- Each entry links to its commit — unstyled, underline on hover, so it still reads as plain text — and `ChangelogLinksPipe` links the `#123` references and makes everything open in a new tab. Sections older than 2023 were seeded from the legacy `bosancz/bosan.cz` repo, whose PR numbers do not map here: they carry commit links but no `#nnn`.
- **Entries end with the avatars of their authors**, linked to their GitHub profiles (a collapsed duplicate entry carries the authors of all its commits). When the committer is somebody else — usually Claude — their avatar sits behind the author's, 90 % covered like a collapsed GitHub avatar stack: not a link, and it does not open on hover. Commits committed by GitHub itself (`noreply@github.com`, i.e. its web UI) show the author alone. The layout hangs off `changelog-credit`/`-author`/`-committer`/`-avatar` in `changelog-modal.component.scss`.
- The account behind an avatar comes from a GitHub no-reply email, otherwise from `GET /repos/:o/:r/commits/:sha` — which needs `GITHUB_TOKEN` (passed to the generate step in `build.yml`) and the commit already pushed. One lookup answers for both identities of a commit. No account → a circle with initials; a failed lookup costs only the avatar, never the run. `--no-authors` skips the API entirely.
- **Released sections are never regenerated, so changing the avatar markup needs `node scripts/generate-changelog.mjs --backfill`** — it rewrites only the credit at the end of each entry already in the file, is idempotent, and falls back to the API for commits the clone lacks (shallow checkout, squashed branch).
- **Both releases generate the changelog, in the build job.** `build.yml` runs the generator right before `docker build` whenever `changelog-version` is set, so the section always reaches the image; `changelog-branch` then decides whether it is *kept*. PROD passes `vN.N.N` plus `changelog-branch: master`, so the file is committed and pushed **after** the image is published (a failed build must not leave a section behind for a version that never shipped — the retry would record it twice), and that commit is what `tag.yml` tags. NEXT passes `NEXT-<short sha>` — the version the app reports — and no branch, so the section lives only inside the image. The range is always "since the last `v*` tag", so nothing accumulates.

## Dev workflow

- **Never start a second dev server, or run `ng build`/`npm run build`, while one is already running.** One warm server is shared by all agents: root `npm run dev` runs frontend + backend via `concurrently` and tees to `dev.log` (gitignored, lines prefixed `[FE]`/`[BE]`, raw ANSI codes — strip them). Verify your change by reading it: `tail -n 80 dev.log`, or `grep '\[FE\]' dev.log` for Angular alone. An error there may come from another agent's in-flight change — check whether the failing file is one you touched before assuming it is yours.
- **A missing or stale `dev.log` means no server is running: you are in a fresh cloud/sandbox session and are expected to start one, so you can actually verify your change.** The rule above only prevents fragmenting an *already running* server; it is not licence to ship unverified.
  - **Angular needs Node 24** — the sandbox's default 22.22.2 is one patch below its engines floor, so every `ng` command fails on the engine check. Node 24 is in `/opt/node24`, installed by the cloud environment's setup script.
  - Lockfiles are committed and `npm ci` works in `frontend/` and `backend/`. Do **not** use the root `npm ci` / `npm run install`: it runs `scripts/install.sh`, which also builds the backend and runs migrations, so it needs a database. `npm install` in a sandbox adds platform-specific optional deps to the lockfile — don't commit that churn.
  - A **frontend-only** change needs no database: `cd frontend && npm ci && npm run dev`, then read the Angular compile output.
  - For a **backend** change, or the full root `npm run dev` (the thing that produces `dev.log`), bring up Postgres first — see below.

## Frontend SDK

- `frontend/src/sdk` is generated from the backend's OpenAPI spec — never hand-edit `frontend/src/sdk/api.ts`. After changing a backend controller/DTO, run `npm run generate:sdk` from `frontend/` (it reads `http://127.0.0.1:3000/api/openapi-json`, so the backend must be up). Every NestJS route needs a unique `operationId` (method name) or generation fails validation.

## Backend entities

- **One table, one entity mapping.** Never map a table twice (an explicit `@Entity("x")` *and* a `@ManyToMany`/`@JoinTable` over `"x"`): TypeORM builds two metadata objects for it and then **every** generated migration drops and recreates that table's indexes — permanent drift that survives being applied. `events_groups` was in this state for years; it is now mapped **only** by the `@ManyToMany`/`@JoinTable` on `Event.groups`, and must not get an entity of its own again.
- **Join tables without an entity are addressed by name.** `events_groups` has no `EntityTarget`, so anything touching it directly works off the table name — see `clearJoinTable()` in `mongo-import.service.ts`. Everything else goes through `Event.groups`.
- **`Event.groupsIds` is a `@RelationId`, so it is read-only.** It populates on any query shape without needing a join, but writes go through the relation: `EventsRepository.updateEvent()` turns `groupsIds` into `groups` references and lets the cascading `save()` sync the join rows.

## Database migrations

- **Always** produce migrations with `npm run migrations:generate --name=<Name>` from `backend/` — never by hand, never `migrations:create`. Schema changes are therefore driven **from the entities**: change the `@Column`/`@Entity` definition first (including `collation`, `type`, `nullable`, indexes) and let the generator diff it against the DB. If you find yourself wanting to write SQL by hand, model it on the entity instead.
- **Always read and fix up the generated migration before running it** — generation is a starting point, not the finished artifact:
  - **Unrelated drift.** The diff compares *all* entities, so it sweeps in changes you did not intend — someone else's in-flight entity edits, or divergence that was already there. Delete those from both `up()` and `down()`.
  - **Statements TypeORM cannot generate.** `CREATE COLLATION`, extensions and functions have no entity representation, so the generator references them without creating them — which fails on a fresh DB and in production. Add them by hand ahead of the statement that depends on them; see `*-GroupNameNaturalNumericCollation.ts`, which creates the `natural_numeric` ICU collation before the column uses it.
  - **That `down()` really reverses `up()`**, including anything you added or removed by hand.
- **Generated columns must be registered in `typeorm_metadata`.** TypeORM stores the `asExpression` of every `generatedType: "STORED"` column there and compares against it on each generate; a migration that adds the column with raw `ALTER TABLE ... GENERATED ALWAYS AS (...)` but skips the metadata row makes **every** later generate drop and recreate it. Pair each `ADD` with the matching `INSERT INTO "typeorm_metadata" (...)` and each `DROP` with a `DELETE`, exactly as the generator emits them — **except** use `current_database()` for `database` instead of the hardcoded DB name, or it won't match in production. See `*-SearchVectorColumns.ts`: it also creates the `unaccent` extension and the `simple_unaccent` search configuration ahead of the columns, and — since TypeORM cannot express `USING gin (...)` — declares the GIN index on the entity with `@Index("…", { synchronize: false })` and creates/drops it by hand.
- **Full-text search uses `search_vector` tsvector columns** on members, events, albums and users: stored generated columns built with `to_tsvector('simple_unaccent', …)` (the 2-arg form is IMMUTABLE, so it is legal in a STORED column — the built-in `unaccent()` is only STABLE). `simple_unaccent` is `simple` (lowercase, no stemming/stopwords) with its word tokens remapped through `unaccent`, giving case- and diacritic-insensitive matching. Query with `search_vector @@ to_tsquery('simple_unaccent', :q)`, building `:q` via `toPrefixTsQuery()` in `helpers/search.ts` (splits input, strips tsquery operators, adds `:*`, ANDs tokens). It matches whole words and prefixes in any order — **not** arbitrary substrings (mid-word `opeč` will not find `Kopeček`; that would need a `pg_trgm` trigram index on a plain text column).
- Apply and verify rather than assume: run `migrations:run` and check the resulting schema/data (e.g. `information_schema.columns`); `migrations:revert` is a cheap way to verify both directions. Then run `migrations:generate` once more — a clean change reports *"No changes in database schema were found"*, anything else is drift to fix before committing. Migrations auto-run in production only (`migrationsRun` in `config.ts`); in dev, apply them yourself.

### Running Postgres in a cloud/sandbox session (no DB already up)

Sandbox sessions start with no database, which the dev server and `migrations:*` need. Postgres 16 is preinstalled and clients point at `localhost:5432`, but it **cannot run as root** — use the preexisting unprivileged `postgres` user.

```bash
PGBIN=/usr/lib/postgresql/16/bin
PGDATA=/tmp/pgdata; rm -rf "$PGDATA"; mkdir -p "$PGDATA"; chown postgres:postgres "$PGDATA" /tmp
su postgres -c "$PGBIN/initdb -D $PGDATA -U postgres --auth=trust"
su postgres -c "$PGBIN/pg_ctl -D $PGDATA -o '-p 5432 -k /tmp -c listen_addresses=127.0.0.1' -l /tmp/pg.log start"
PGPASSWORD=postgres psql -h 127.0.0.1 -U postgres -c "CREATE DATABASE interni;"
PGPASSWORD=postgres psql -h 127.0.0.1 -U postgres -d interni -c "CREATE EXTENSION IF NOT EXISTS postgis;"
```

- **PostGIS** (needed by `Event.placeGeometry`) is not preinstalled; if `CREATE EXTENSION postgis` fails, `apt-get update && apt-get install -y postgresql-16-postgis-3` — the `update` is required, the stale index 404s otherwise. `unaccent` ships with core.
- Then point the tooling at the cluster with the `DB_*` vars from `config.ts` and run migrations from `backend/`:
  ```bash
  export DB_HOST=127.0.0.1 DB_PORT=5432 DB_USER=postgres DB_PASSWORD=postgres DB_DATABASE_NAME=interni DB_SCHEMA=public
  npm ci && npm run migrations:run
  ```
