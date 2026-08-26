# Multi-column sorting (desktop)

Allow ordering a list by several columns at once — e.g. members by group, then by role — driven
from the `admin-table` header on desktop. Mobile keeps its single-column sort control, but the
members list gets a multi-column **default** order (group, then role) that applies on every
viewport.

## Goals

- `?sort=group,role&order=ASC,DESC` is honoured by every endpoint that already uses `applySort`.
- Desktop header click cycles a column **ASC → DESC → off**; clicking an unsorted column appends
  it as the last sort key.
- Removing a key just drops it from the list — the remaining keys shift up, so the second column
  becomes primary without any special-casing.
- A small index badge (1, 2, 3 …) next to the caret shows the sort priority, but only while more
  than one column is active.
- Members list default order (no `sort` param at all) becomes group ASC, then role DESC. Any
  user-chosen sort replaces the default entirely; on mobile the user's sort stays single-column.

## Non-goals

- No multi-column building on mobile — `bo-sort-select` stays a single dropdown.
- No drag-to-reorder of sort keys, no "reset sort" button. Priority is the order in which the
  user clicked the columns; to clear a key you cycle it past DESC.
- No persistence beyond the existing query params.

---

## 1. Backend — `applySort` accepts a list

**[backend/src/helpers/sort.ts](../backend/src/helpers/sort.ts)**

Keep the signature shape, widen the meaning of the parameters:

- `SortOptions.sort` / `.order` stay strings, now optionally comma-separated (`"group,role"` /
  `"ASC,DESC"`).
- Parse into `[key, order]` pairs. Resolve each key through the whitelist; **drop pairs whose key
  is not whitelisted** (unchanged injection safety). Missing order at index `i` defaults to `ASC`.
- Cap at 4 keys — cheap guard against a pathological `?sort=a,a,a,…`.
- De-duplicate keys, keeping the first occurrence, so a repeated key can't produce a redundant
  `ORDER BY`.
- Apply as `orderBy` for the first surviving pair and `addOrderBy` for the rest.
- `fallback` becomes a list: `{ column: string; order: SortOrder }[]` (or accept a single object
  and normalise — either is fine, but the array is what the members default needs). Used only when
  **no** pair survives, exactly as today.

Sketch:

```ts
export interface SortSpec {
	column: string;
	order: SortOrder;
}

const MAX_SORT_KEYS = 4;

export function applySort<T extends ObjectLiteral>(
	q: SelectQueryBuilder<T>,
	options: SortOptions,
	whitelist: Record<string, string>,
	fallback: SortSpec | SortSpec[],
): SelectQueryBuilder<T> {
	const specs = parseSort(options, whitelist);
	const applied = specs.length ? specs : [fallback].flat();
	applied.forEach((spec, i) => (i === 0 ? q.orderBy(spec.column, spec.order) : q.addOrderBy(spec.column, spec.order)));
	return q;
}
```

Export a helper the repositories can reuse for their own tie-breaker logic:

```ts
/** Whitelisted sort keys the client actually asked for, in priority order. */
export function parseSortKeys(options: SortOptions, whitelist: Record<string, string>): string[];
```

Update the doc comment on the file — it currently describes single-column behaviour.

## 2. Backend — DTO validation

**[backend/src/api/helpers/dto.ts](../backend/src/api/helpers/dto.ts)**

`order` is `@IsIn(["ASC","DESC"])`, which rejects `"ASC,DESC"`. Replace with a regex that allows a
comma-separated list of at most 4 directions, keeping the upper-casing `@Transform`:

```ts
@ApiPropertyOptional({ example: "ASC,DESC" })
@Transform(({ value }) => (typeof value === "string" ? value.toUpperCase() : value))
@Matches(/^(ASC|DESC)(,(ASC|DESC)){0,3}$/)
@IsOptional()
order?: string;
```

Update both property doc comments to mention the comma-separated form.

Consequence: the OpenAPI schema for `order` changes from an enum to a plain string, so the
generated `SDK.List*OrderEnum` types disappear — see step 5.

## 3. Backend — members default order

**[backend/src/models/members/repositories/members.repository.ts](../backend/src/models/members/repositories/members.repository.ts)**

- Change the `applySort` fallback from the single nickname spec to:

  ```ts
  [
  	{ column: "(SELECT g.name FROM groups g WHERE g.id = members.group_id)", order: "ASC" },
  	{ column: "members.role", order: "DESC" },
  ];
  ```

  Pull the group subquery and the nickname expression into named consts so the whitelist and the
  fallback share one definition instead of repeating the SQL.

  `role` is a Postgres `enum` declared `dite, instruktor, vedouci`, so enum ordering is declaration
  order and **DESC gives vedoucí → instruktor → dítě**. That matches the existing group detail
  screen, which already defaults to `role DESC`
  ([group-members.component.ts:83-84](../frontend/src/app/features/members/components/group-members/group-members.component.ts#L83-L84)).

- The nickname tie-breaker at
  [members.repository.ts:57-60](../backend/src/models/members/repositories/members.repository.ts#L57-L60)
  currently keys off `options.sort === "group"`. Generalise it: append the nickname ordering
  whenever the applied sort does not already include `nickname` or `name`. Use `parseSortKeys`, and
  make it apply to the fallback path too so the new default ends with a stable nickname order
  inside each (group, role) bucket.

- Verify against the pagination path: `take`/`skip` plus the `contacts` left join makes TypeORM use
  a distinct-id subquery, and every ORDER BY expression must be resolvable there. `role` and the
  group subquery are both fine, but this needs an actual check with `?contacts=true` — see
  Verification.

Albums and events repositories need **no** change; they inherit list support for free through
`applySort`.

## 4. Frontend — `admin-table` multi-key state

**[admin-table.component.ts](../frontend/src/app/shared/components/admin-table/admin-table.component.ts)**

Keep the public inputs as comma-joined strings so no page has to change how it binds:

- `sort = input<string | null>(null)` — now `"group,role"`.
- `order = input<AdminTableSortOrder | string>("ASC")` — now `"ASC,DESC"`. Widen the type.
- `sortChange` keeps emitting `AdminTableSort { sort: string; order: string }`, with both fields
  comma-joined. Document the shape change in the interface doc comment — the field is a list now.

Internals:

```ts
/** Parsed active sort, in priority order. */
readonly activeSort = computed<{ key: string; order: AdminTableSortOrder }[]>(...);

/** Zero-based position of a column in the active sort, or -1. */
sortIndex(key: string): number;
```

New `onSort` cycle:

| current state of clicked column | next state                    |
| ------------------------------- | ----------------------------- |
| not in the list                 | appended at the end, ASC      |
| in the list, ASC                | same position, DESC           |
| in the list, DESC               | removed (later keys shift up) |

```ts
onSort(column: AdminTableColumnComponent) {
	const key = column.sort();
	if (!key) return;
	const current = this.activeSort();
	const i = current.findIndex((s) => s.key === key);
	let next: typeof current;
	if (i < 0) next = [...current, { key, order: "ASC" }];
	else if (current[i].order === "ASC")
		next = current.map((s, j) => (j === i ? { ...s, order: "DESC" as const } : s));
	else next = current.filter((_, j) => j !== i);
	this.sortChange.emit({
		sort: next.map((s) => s.key).join(","),
		order: next.map((s) => s.order).join(","),
	});
}
```

Emitting `{ sort: "", order: "" }` when the last key is cycled off is what every page already
treats as "back to default" (`sort.sort || null`), so clearing works with no page changes.

**[admin-table.component.html](../frontend/src/app/shared/components/admin-table/admin-table.component.html#L9-L22)**

Header button (lines 9–22): replace the `sort() === column.sort()` equality checks with the index
lookup, and add the priority badge:

```html
@let idx = sortIndex(column.sort());
<button type="button" class="admin-table-sort" [class.admin-table-sort-active]="idx >= 0" (click)="onSort(column)">
	<span>{{ column.header() }}</span>
	@if (idx >= 0) {
	<ion-icon [name]="activeSort()[idx].order === 'ASC' ? 'caret-up' : 'caret-down'"></ion-icon>
	@if (activeSort().length > 1) {
	<span class="admin-table-sort-index">{{ idx + 1 }}</span>
	} } @else {
	<ion-icon name="swap-vertical" class="admin-table-sort-idle"></ion-icon>
	}
</button>
```

Add `aria-label` / `title` on the button spelling out the next action ("seřadit vzestupně" /
"sestupně" / "zrušit řazení") so the three-state cycle is discoverable.

**[admin-table.component.scss](../frontend/src/app/shared/components/admin-table/admin-table.component.scss)**

Style `.admin-table-sort-index` as a small superscript-ish badge next to the caret — smaller font,
muted colour, no wrap, matching the existing `.admin-table-sort-*` styles.

## 5. Frontend — pages and SDK

**SDK regeneration** (from `frontend/`, dev server up): `npm run generate:sdk`. `order` becomes
`string`, so the two enum casts break and must be dropped:

- [members-list.component.ts:337](../frontend/src/app/features/members/pages/members-list/members-list.component.ts#L337) — `filter["order"] as SDK.ListMembersOrderEnum`
- [albums-list.component.ts:231](../frontend/src/app/features/albums/pages/albums-list/albums-list.component.ts#L231) — `filter.order as SDK.ListAlbumsOrderEnum`

[events-list.component.ts:440](../frontend/src/app/features/events/pages/events-list/events-list.component.ts#L440) already passes it untyped.

**Page sort state** — the query-param round trip already stores whatever string it is given, so
these need only a type widen, not a rewrite:

- `sortOrder = signal<"ASC" | "DESC">` → `signal<string>` in
  [members-list](../frontend/src/app/features/members/pages/members-list/members-list.component.ts#L96-L97),
  [albums-list](../frontend/src/app/features/albums/pages/albums-list/albums-list.component.ts),
  [events-list](../frontend/src/app/features/events/pages/events-list/events-list.component.ts) and
  [group-members](../frontend/src/app/features/members/components/group-members/group-members.component.ts#L83-L84).
- The `params["order"] === "DESC" ? "DESC" : "ASC"` normalisation (e.g.
  [members-list.component.ts:278](../frontend/src/app/features/members/pages/members-list/members-list.component.ts#L278))
  must stop collapsing a list to a single value — take the param as-is, defaulting to `"ASC"` when
  absent.
- `onSortChange` handlers are unchanged; they already pass `sort.sort` / `sort.order` straight into
  the query params.

`group-members` keeps its `"role"` / `"DESC"` default and gains desktop multisort for free through
the shared component.

## 6. Frontend — mobile `bo-sort-select`

**[sort-select.component.ts](../frontend/src/app/shared/components/sort-select/sort-select.component.ts)**

Stays single-column, with two defensive tweaks for the case where a URL carries a multi-key sort
(desktop link opened on a phone, or a narrow viewport):

- Selecting a column emits a **single** key/order pair, replacing whatever multi-key sort was
  active. This is the "custom sorting overrides the default and continues with single sort only"
  behaviour.
- The `[sort]`/`[order]` inputs may now contain commas: show the _first_ key as the selected option
  and the first direction in the segment, so the control never renders a value that isn't in its
  option list (`ion-select` would show blank).

Add a computed `primaryKey` / `primaryOrder` in the component and bind those in the template
instead of `sort()` / `order()` directly.

The members list default (group, role) is a **backend fallback**, not a `sort` param, so on mobile
the select correctly shows "Výchozí" while the server orders by group then role — which is exactly
the requested behaviour.

---

## Verification

- `dev.log` compiles clean for both `[FE]` and `[BE]` (do not start another dev server).
- Manual API checks: `?sort=group,role&order=ASC,DESC`, `?sort=group&order=ASC` (unchanged
  single-key behaviour), `?sort=bogus,role` (bogus key silently dropped), `?order=ASC,BOGUS`
  (400 from validation), no params at all (members → group ASC, role DESC, nickname ASC).
- `?sort=group,role&contacts=true&limit=20&offset=20` — confirms the distinct-id pagination
  subquery tolerates the multi-key ORDER BY with the contacts join.
- UI: on the members table click Oddíl then Role — badges show 1 and 2; cycle Oddíl past DESC and
  Role becomes 1; cycle Role off and the table returns to the default order with no badges.
- Reload after each click: the sort survives the query-param round trip.
- Mobile viewport on the members list: default rows come back grouped, the sort modal shows
  "Výchozí", and picking a column produces a single-key sort.

## Open questions

- **Role direction in the default.** Plan assumes `role DESC` (vedoucí first), matching the group
  detail screen. If dítě-first is wanted it is a one-word change in the fallback.
- **Cap of 4 sort keys** is arbitrary; no current table has more than ~10 sortable columns and 4
  covers any realistic combination.
- **Discoverability of the three-state cycle.** Only the tooltip communicates that a third click
  removes the column. If that proves confusing, a "zrušit řazení" entry in a header context menu
  would be the follow-up — deliberately out of scope here.

## File checklist

| File                                                                     | Change                                                     |
| ------------------------------------------------------------------------ | ---------------------------------------------------------- |
| `backend/src/helpers/sort.ts`                                            | list parsing, `addOrderBy`, list fallback, `parseSortKeys` |
| `backend/src/api/helpers/dto.ts`                                         | `order` regex validation                                   |
| `backend/src/models/members/repositories/members.repository.ts`          | group+role fallback, generalised nickname tie-break        |
| `frontend/src/sdk/api.ts`                                                | regenerated (`npm run generate:sdk`)                       |
| `frontend/…/admin-table/admin-table.component.ts`                        | parsed multi-key state, three-state `onSort`               |
| `frontend/…/admin-table/admin-table.component.html`                      | index-based active check, priority badge                   |
| `frontend/…/admin-table/admin-table.component.scss`                      | badge styling                                              |
| `frontend/…/sort-select/sort-select.component.ts` + `.html`              | tolerate comma input, emit single key                      |
| `frontend/…/members-list`, `albums-list`, `events-list`, `group-members` | widen order type, drop enum casts, keep raw param          |
