import { ObjectLiteral, SelectQueryBuilder } from "typeorm";

export type SortOrder = "ASC" | "DESC";
export type SortNulls = "NULLS FIRST" | "NULLS LAST";

export type SortColumn = string | { column: string; nulls: SortNulls };

export interface SortOptions {
	sort?: string;
	order?: SortOrder;
}

export function applySort<T extends ObjectLiteral>(
	q: SelectQueryBuilder<T>,
	options: SortOptions,
	whitelist: Record<string, SortColumn>,
	fallback: { column: string; order: SortOrder },
): SelectQueryBuilder<T> {
	const entry = options.sort ? whitelist[options.sort] : undefined;
	if (entry) {
		if (typeof entry === "string") q.orderBy(entry, options.order ?? "ASC");
		else q.orderBy(entry.column, options.order ?? "ASC", entry.nulls);
	} else {
		q.orderBy(fallback.column, fallback.order);
	}
	return q;
}
