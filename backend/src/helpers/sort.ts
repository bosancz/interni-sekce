import { ObjectLiteral, SelectQueryBuilder } from "typeorm";

export type SortOrder = "ASC" | "DESC";
export type SortNulls = "NULLS FIRST" | "NULLS LAST";

export type SortColumn = string | { column: string; nulls: SortNulls };

export interface SortOptions {
	sort?: string;
	order?: string;
}

export interface SortSpec {
	key: string;
	order: SortOrder;
}

export function parseSort(options: SortOptions, whitelist: Record<string, SortColumn>): SortSpec[] {
	if (!options.sort) return [];

	const orders = (options.order ?? "").split(",");
	const specs: SortSpec[] = [];

	options.sort.split(",").forEach((raw, i) => {
		const key = raw.trim();
		if (!(key in whitelist) || specs.some((spec) => spec.key === key)) return;
		specs.push({ key, order: orders[i]?.trim().toUpperCase() === "DESC" ? "DESC" : "ASC" });
	});

	return specs;
}

export function applySort<T extends ObjectLiteral>(
	q: SelectQueryBuilder<T>,
	options: SortOptions,
	whitelist: Record<string, SortColumn>,
	fallback: { column: string; order: SortOrder },
): SortSpec[] {
	const specs = parseSort(options, whitelist);

	if (!specs.length) {
		q.orderBy(fallback.column, fallback.order);
		return specs;
	}

	specs.forEach((spec, i) => {
		const entry = whitelist[spec.key];
		const [column, nulls] = typeof entry === "string" ? [entry, undefined] : [entry.column, entry.nulls];
		if (i === 0) q.orderBy(column, spec.order, nulls);
		else q.addOrderBy(column, spec.order, nulls);
	});

	return specs;
}
