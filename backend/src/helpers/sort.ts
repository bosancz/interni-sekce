import { ObjectLiteral, SelectQueryBuilder } from "typeorm";

export type SortOrder = "ASC" | "DESC";

export interface SortOptions {
	sort?: string;
	order?: SortOrder;
}

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
