# Project notes

## Dev workflow

- Do not run build checks (e.g. `ng build`, `npm run build`) if a dev server is already running — rely on the running dev server's compilation output instead.
- One warm dev server is shared across all agents. `npm run dev` (root) runs frontend + backend via `concurrently` and tees combined output to `dev.log` in the repo root. To check whether your change compiled or broke the app, read `dev.log` (e.g. `tail -n 80 dev.log`, or `grep '\[FE\]' dev.log` for Angular only) — do **not** start your own `ng serve`/dev server (the port is already in use and it just fragments the setup). Lines are prefixed `[FE]`/`[BE]`; the file contains raw ANSI color codes, so strip them when parsing. `dev.log` is gitignored.
- Because the server (and `dev.log`) is shared, an error in the log may originate from another agent's concurrent change, not yours. Before assuming your edit broke the build, check whether the failing file/area is one you touched; if not, it is likely someone else's in-flight work and will clear on its own.

## Frontend SDK

- The frontend SDK (`frontend/src/sdk`) is generated from the backend's OpenAPI spec — do **not** hand-edit `frontend/src/sdk/api.ts`. After changing a backend controller/DTO, regenerate it: from `frontend/`, run `npm run generate:sdk` (it reads the spec from the running backend at `http://127.0.0.1:3000/api/openapi-json`, so the dev server must be up). Every NestJS route needs a unique `operationId` (method name) or generation fails validation.

## Backend entities

- **One table, one entity mapping.** Never map the same table twice (e.g. an explicit `@Entity("x")` *and* a `@ManyToMany`/`@JoinTable` over `"x"`). TypeORM then builds two metadata objects for it, and the schema builder drops and recreates that table's indexes in **every** generated migration — permanent drift that survives being applied. `events_groups` was in this state for years; it is now mapped only by `EventGroup`.
- **`Event.eventGroups` is the single source of truth for group membership.** Because `events_groups` is mapped explicitly, the real relation is `Event.eventGroups` (`@OneToMany` → `EventGroup`). There are no derived `Event.groups` / `Event.groupsIds` fields — consumers read the group ids straight off `eventGroups[].groupId`. Consequences:
  - Any **new query returning events must `leftJoinAndSelect("events.eventGroups", "eventGroups")`**, otherwise `eventGroups` comes back `undefined` and the frontend loses group assignments. To also expose the full `Group` on each row (the public program needs the short name), additionally join `eventGroups.group`.
  - **Writes go through `EventsRepository.updateEventGroups()`**, which syncs the join rows in a transaction. Do not expect a cascading `save()` to sync them the way `@JoinTable` used to. `EventUpdateBody` (the `PATCH /events/:id` body) does **not** carry groups — membership is edited via the dedicated `PUT /events/:id/groups` endpoint (`EventGroupsUpdateBody { groupsIds }`).
  - `EventResponse` exposes `eventGroups` (`EventGroupResponse[]`) directly, so the SDK contract is `eventGroups`, not `groups` / `groupsIds`. The public bosan.cz program keeps its own legacy shape (a `groups` array of short names), derived from `eventGroups` in `PublicService.serializeEvent()`.

## Database migrations

- **Always** produce migrations with `npm run migrations:generate --name=<MigrationName>` (from `backend/`), never by hand and never with `migrations:create`. The generator diffs the entities against the DB, so the migration comes out in TypeORM's own format and naming — hand-written files drift from that shape.
- This means schema changes are driven **from the entities**: change the `@Column`/`@Entity` definition first (including options like `collation`, `type`, `nullable`, indexes), then generate. If you find yourself wanting to write SQL by hand, model it on the entity instead and let the generator emit it.
- **Always read and fix up the generated migration before running it** — generation is a starting point, not the finished artifact. Check for all of:
  - **Unrelated drift.** The diff compares *all* entities against the DB, so it happily sweeps in changes you did not intend — indexes/columns from someone else's in-flight entity edits, or divergence that was already there. Delete those statements (from both `up()` and `down()`) so the migration only contains the change you meant to make.
  - **Statements TypeORM cannot generate.** A few DB objects have no entity representation (`CREATE COLLATION`, extensions, functions), so the generator emits code that references them without creating them — which fails on a fresh DB or in production. Add those statements by hand, ahead of the statement that depends on them; see `*-GroupNameNaturalNumericCollation.ts`, which creates the `natural_numeric` ICU collation before the column starts using it.
  - **That `down()` really reverses `up()`**, including any statements you added or removed by hand.
- Then apply it and confirm it actually works, rather than assuming — run `migrations:run`, and check the resulting schema/data (e.g. query `information_schema.columns`). `migrations:revert` is a cheap way to verify both directions.
- Migrations auto-run in production only (`migrationsRun` in `config.ts`); in dev, apply them yourself with `npm run migrations:run` (`migrations:revert` undoes the last one).
