# Project notes

## Code style

- **No explanatory comments anywhere** — TS, templates, SCSS, migrations. What is worth remembering across sessions goes into this file; a note to the reviewer goes into the commit message. `TODO`/`FIXME` and tool directives (`@ts-ignore`, eslint) are fine. Keep this file compact.
- **Prettier formats the repo**: `./backend/node_modules/.bin/prettier --write .` from the root (`.prettierrc.yml`: tabs, width 120). `.prettierignore` holds `!old`, `frontend/src/sdk`, `frontend/src/assets/lib`, `backend/assets` and `CHANGELOG.md` out of it.
- `!old/` is the retired server kept for reference — never edit it.

## Commits & changelog

- **Conventional Commits** (`type(scope): description`), enforced by commitlint. **Description in Czech**, `type`/`scope` in English: the visitor-facing changelog takes subjects **verbatim**.
- **An issue reaches the changelog only if the commit itself references it** — `Closes #123` (also `Fixes`/`Resolves`/`Refs`) in the commit body, or `(#123)` in the subject. PR bodies are not git history; merges are skipped (`--no-merges`).
- `scripts/generate-changelog.mjs` **prepends** the new version's section to `CHANGELOG.md`, so older sections survive edits. One flat list per version, each entry led by its type's gitmoji (`feat` ✨, `fix` 🐛, `style` 🎨, `perf` ⚡️, `refactor` ♻️, `docs` 📝, `test` ✅, `build` 📦️, `ci` 👷, `revert` ⏪️, `chore` 🔧, and last ❓ for non-conventional subjects, taken whole). A non-conventional subject repeating a typed commit's description merges into that entry. Served at `GET /api/changelog`; the version in the menu opens it.
- Each entry links to its commit and ends with its authors' **avatars**: author linked to GitHub, committer (usually Claude) tucked 60 % behind — no link, one shared tooltip ("Kopec a Claude"); commits committed by GitHub's own web UI show the author alone. Accounts resolve from GitHub no-reply emails, else `GET /repos/:o/:r/commits/:sha` (needs `GITHUB_TOKEN` and the commit pushed); no account → initials circle, a failed lookup costs only the avatar. `--no-authors` skips the API. Markup hangs off `changelog-credit`/`-author`/`-committer`/`-avatar` in `changelog-modal.component.scss`; `ChangelogLinksPipe` links `#123` and opens everything in a new tab. Pre-2023 sections came from the legacy `bosancz/bosan.cz` repo — commit links, no `#nnn`.
- Released sections are never regenerated, so changed markup needs `--backfill` (re-renders only each entry's gitmoji and credit, idempotent, matches by commit link so the hand-written `v4.0.0` entry stays untouched). `--backfill-other` appends the ❓ entries missing from each tag range (needs `git fetch --unshallow --tags`, idempotent, skips hand-written sections).
- **Both releases generate the changelog in the build job.** `build.yml` runs the generator before `docker build` whenever `changelog-version` is set; `changelog-branch` decides whether the file is kept. PRODUCTION passes `vN.N.N` + `changelog-branch: master` → committed and pushed **after** the image is published (a failed build must not record a version that never shipped), and `tag.yml` tags that commit. NEXT passes `NEXT-<short sha>` and no branch → the section lives only inside the image. The range is always "since the last `v*` tag".

## Dev workflow

- **Never start a second dev server, or run `ng build`/`npm run build`, while one is already running.** Root `npm run dev` runs frontend + backend via `concurrently` and tees to `dev.log` (gitignored, `[FE]`/`[BE]` prefixes, raw ANSI). Verify your change by reading it (`tail -n 80 dev.log`); an error there may be another agent's in-flight change.
- **A missing or stale `dev.log` means no server is running** — you are in a fresh sandbox and are expected to start one, not to ship unverified.
  - **Angular needs Node 24**; the sandbox default (22.x) fails every `ng` command on the engines check. `nvm install 24` (`NVM_DIR=/opt/nvm`).
  - `npm ci` works in `frontend/` and `backend/`. Do **not** run the root `npm ci` — `scripts/install.sh` also builds the backend and runs migrations, so it needs a database. Don't commit lockfile churn from `npm install`.
  - Frontend-only change: `cd frontend && npm ci && npm run dev`. Backend change or the full root `npm run dev`: bring up Postgres first (below).
- **`.mcp.json` registers the Angular CLI MCP server** (`npx -y @angular/cli mcp`) — docs/best-practices plus workspace tools, run from the repo root, Node 24 like every `ng` command; its `devserver_start` falls under the one-server rule.

## Frontend SDK

- `frontend/src/sdk` is generated from the backend's OpenAPI spec — never hand-edit `api.ts`. After changing a backend controller/DTO run `npm run generate:sdk` from `frontend/` (reads `http://127.0.0.1:3000/api/openapi-json`, so the backend must be up). Every NestJS route needs a unique `operationId` (method name) or generation fails validation.
- The Nest Swagger plugin runs with `introspectComments: true`, so JSDoc on DTO/entity properties and routes would become OpenAPI descriptions. We don't write it (see _Code style_) — descriptions belong in `@ApiProperty({ description })` when they are actually wanted.

## Public API (bosan.cz)

- The iCalendar feed is `GET /api/public/program/ical` (`ProgramIcalService`, `ical-generator`). `ProgramIcalLegacyController` keeps the old server's `/api/program/ical` alive — deprecated in OpenAPI, same body. Never drop it without warning: ICS subscriptions are set-and-forget.
- Events are **all-day**: `DTEND` is exclusive (`dateTill + 1 day`) and the calendar deliberately sets **no** timezone (with one, `ical-generator` renders `DTSTAMP` as floating local time, which is invalid; the Luxon values carry `Europe/Prague` themselves). `timeFrom`/`timeTill` are free text ("ráno") and are never parsed.
- Cancelled events stay in the feed as `STATUS:CANCELLED` with a `Zrušeno: ` summary prefix. `UID` is `event-<id>@bosan.cz`, stable so clients update instead of duplicating. Window: `ICAL_DAYS_BACK` (30) back, unbounded forward; `EventsRepository.getPublicProgramIcal()` skips the 100-row cap of the JSON program endpoint.
- bosan.cz resolves the feed URL from the API root's `_links` (`program:ical`), falling back to a hardcoded URL — the hardcoded one going stale is what broke this originally (#352).

## API routes & links

- **Route parameters are named after their entity, never `id`** — `:eventId`, `:memberId`, `:albumId`, … The `Public API` controllers are the exception: their `:id` params are in URLs bosan.cz already calls. Renaming a param changes the SDK signature, so regenerate it.
- **`_links` hrefs substitute `:param` from the document**, so an entity-named param does not resolve from a doc that only has `id`. Each permission maps it with `params: { eventId: "id" }` — a `keyof DOC` name, or a `(doc) => …` function — applied to the **whole** href, controller prefix included. The older `path:` option only replaces the method path and duplicates the prefix; don't use it. Params the document cannot know (`:memberId` on an event link, `:size` on a photo) stay literal by design.

## Backend entities

- **One table, one entity mapping.** Never map a table twice (an explicit `@Entity("x")` _and_ a `@JoinTable` over `"x"`): TypeORM builds two metadata objects and **every** generated migration then drops and recreates that table's indexes — drift that survives being applied. `events_groups` is mapped **only** by the `@ManyToMany`/`@JoinTable` on `Event.groups` and must never get an entity again; code touching it directly works off the table name (`clearJoinTable()` in `mongo-import.service.ts`).
- **`Event.groupsIds` is a `@RelationId`, so it is read-only.** Writes go through the relation: `EventsRepository.updateEvent()` turns `groupsIds` into `groups` references and lets the cascading `save()` sync the join rows.
- **Files imported from the old server keep their Mongo ObjectId** in `Event.srcId` / `Photo.srcId`+`srcAlbumId` and stay in the legacy on-disk layout (folder keyed by the ObjectId, `registration.pdf`); native records use the numeric-id layout (`prihlaska_<name>.pdf`). Resolution coalesces on `srcId` — see `PhotosFilesService.getPhotoImagePath` and `EventsRegistrationsController`.

## Database migrations

- **Always** generate migrations with `npm run migrations:generate --name=<Name>` from `backend/` — never by hand, never `migrations:create`. Change the `@Column`/`@Entity` definition first (collation, type, nullable, indexes) and let the generator diff it against the DB.
- **Always read and fix up the generated migration before running it**: delete unrelated drift the diff swept in (it compares _all_ entities); add by hand what TypeORM cannot generate (`CREATE COLLATION`, extensions, text-search configs) ahead of the statement needing it — see `*-GroupNameNaturalNumericCollation.ts`; and make sure `down()` really reverses `up()`.
- **Generated columns must be registered in `typeorm_metadata`**, or every later generate drops and recreates them: pair each `ADD` with the `INSERT INTO "typeorm_metadata"` the generator emits and each `DROP` with a `DELETE`, but use `current_database()` instead of a hardcoded DB name. `*-SearchVectorColumns.ts` is the reference: it also creates the `unaccent` extension and `simple_unaccent` config, and — since TypeORM cannot express `USING gin (...)` — declares the GIN index with `@Index("…", { synchronize: false })` and creates/drops it by hand.
- **Full-text search uses stored `search_vector` tsvector columns** on members, members_contacts, events, albums and users, built with `to_tsvector('simple_unaccent', …)` (the 2-arg form is IMMUTABLE, so it is legal in a STORED column). `simple_unaccent` is `simple` with word tokens remapped through `unaccent` → case- and diacritic-insensitive. Query with `search_vector @@ to_tsquery('simple_unaccent', :q)` and build `:q` via `toPrefixTsQuery()` (`helpers/search.ts`). It matches whole words and prefixes only — not mid-word substrings (that would need `pg_trgm`).
- **Members and their contacts are also searched by phone and e-mail** (#362). The column expression normalises phones (separators between digits dropped, so `777 123 456` is one token; leading `+420`/`00420` stripped, a bare `420` kept — `4xx xxx xxx` is a real landline range) and splits e-mails with `translate(…, '@._+-', '     ')`, or the parser emits the whole address as a single token. `toPrefixTsQuery()` normalises phones the same way — **change one and you must change the other**. A generated column only sees its own row, so `MembersRepository.getMembers()` ORs the member's vector with an `EXISTS` over their contacts' vectors.
- Apply and verify rather than assume: `migrations:run`, check the schema/data, `migrations:revert` to test both directions, then `migrations:generate` once more — a clean change reports _"No changes in database schema were found"_. Migrations auto-run in production only; in dev, apply them yourself.

### Running Postgres in a cloud/sandbox session

Postgres 16 is preinstalled but **cannot run as root** — use the unprivileged `postgres` user.

```bash
PGBIN=/usr/lib/postgresql/16/bin
PGDATA=/tmp/pgdata; rm -rf "$PGDATA"; mkdir -p "$PGDATA"; chown postgres:postgres "$PGDATA" /tmp
su postgres -c "$PGBIN/initdb -D $PGDATA -U postgres --auth=trust"
su postgres -c "$PGBIN/pg_ctl -D $PGDATA -o '-p 5432 -k /tmp -c listen_addresses=127.0.0.1' -l /tmp/pg.log start"
PGPASSWORD=postgres psql -h 127.0.0.1 -U postgres -c "CREATE DATABASE interni;"
PGPASSWORD=postgres psql -h 127.0.0.1 -U postgres -d interni -c "CREATE EXTENSION IF NOT EXISTS postgis;"
export DB_HOST=127.0.0.1 DB_PORT=5432 DB_USER=postgres DB_PASSWORD=postgres DB_DATABASE_NAME=interni DB_SCHEMA=public
cd backend && npm ci && npm run migrations:run
```

**PostGIS** (needed by `Event.placeGeometry`) is not preinstalled: if `CREATE EXTENSION postgis` fails, `apt-get update && apt-get install -y postgresql-16-postgis-3` — the `update` is required. `unaccent` ships with core.
