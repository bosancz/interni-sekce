import { ObjectLiteral, SelectQueryBuilder } from "typeorm";

export type SortOrder = "ASC" | "DESC";

export interface SortOptions {
	sort?: string;
	order?: SortOrder;
}

/**
 * Applies a whitelisted ORDER BY to a query builder.
 *
 * `whitelist` maps a client-facing sort key to a trusted SQL column/expression —
 * only keys present in it are ever ordered by, so the raw `options.sort` string
 * never reaches the query. When `options.sort` is missing or not whitelisted the
 * `fallback` order is used, preserving each endpoint's original default sort.
 */
export function applySort<T extends ObjectLiteral>(
	q: SelectQueryBuilder<T>,
	options: SortOptions,
	whitelist: Record<string, string>,
	fallback: { column: string; order: SortOrder },
): SelectQueryBuilder<T> {
	const column = options.sort ? whitelist[options.sort] : undefined;
	if (column) {
		q.orderBy(column, options.order ?? "ASC");
	} else {
		q.orderBy(fallback.column, fallback.order);
	}
	return q;
}
