import { ObjectLiteral, SelectQueryBuilder } from "typeorm";

export type SortOrder = "ASC" | "DESC";

export interface SortOptions {
	/** One or more sort keys, comma-separated in priority order (e.g. `"group,role"`). */
	sort?: string;
	/** Matching directions, comma-separated (e.g. `"ASC,DESC"`); missing entries default to ASC. */
	order?: string;
}

export interface SortSpec {
	column: string;
	order: SortOrder;
}

// Cheap guard against a pathological `?sort=a,a,a,…`; no table has this many sortable columns.
const MAX_SORT_KEYS = 4;

/**
 * Whitelisted sort keys the client actually asked for, in priority order.
 *
 * Parses the comma-separated `options.sort`, keeps only keys present in `whitelist`
 * (so an injected key never reaches the query), de-duplicates keeping the first
 * occurrence, and caps the result at {@link MAX_SORT_KEYS}. Repositories can reuse
 * this for their own tie-breaker logic.
 */
export function parseSortKeys(options: SortOptions, whitelist: Record<string, string>): string[] {
	if (!options.sort) return [];

	const keys: string[] = [];
	for (const raw of options.sort.split(",")) {
		const key = raw.trim();
		if (!key || !(key in whitelist)) continue; // drop unknown/unwhitelisted keys
		if (keys.includes(key)) continue; // de-duplicate, first occurrence wins
		keys.push(key);
		if (keys.length >= MAX_SORT_KEYS) break;
	}
	return keys;
}

/** Parse `options` into whitelisted `[column, order]` pairs, in priority order. */
function parseSortSpecs(options: SortOptions, whitelist: Record<string, string>): SortSpec[] {
	const keys = parseSortKeys(options, whitelist);
	const orders = (options.order ?? "").split(",");

	return keys.map((key, i) => {
		const order = (orders[i] ?? "").trim().toUpperCase();
		return { column: whitelist[key], order: order === "DESC" ? "DESC" : "ASC" };
	});
}

/**
 * Applies a whitelisted ORDER BY to a query builder, supporting multi-column sorting.
 *
 * `whitelist` maps each client-facing sort key to a trusted SQL column/expression —
 * only keys present in it are ever ordered by, so the raw `options.sort` string never
 * reaches the query. `options.sort` / `options.order` may be comma-separated lists
 * (`"group,role"` / `"ASC,DESC"`), applied in priority order via `orderBy` for the
 * first key and `addOrderBy` for the rest. When no whitelisted key survives, the
 * `fallback` order is used, preserving each endpoint's original default sort. The
 * fallback may itself be a list of specs (e.g. the members group+role default).
 */
export function applySort<T extends ObjectLiteral>(
	q: SelectQueryBuilder<T>,
	options: SortOptions,
	whitelist: Record<string, string>,
	fallback: SortSpec | SortSpec[],
): SelectQueryBuilder<T> {
	const specs = parseSortSpecs(options, whitelist);
	const applied = specs.length ? specs : [fallback].flat();

	applied.forEach((spec, i) =>
		i === 0 ? q.orderBy(spec.column, spec.order) : q.addOrderBy(spec.column, spec.order),
	);

	return q;
}
