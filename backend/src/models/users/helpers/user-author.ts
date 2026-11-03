import { ObjectLiteral, SelectQueryBuilder } from "typeorm";

export function leftJoinUserAuthor<T extends ObjectLiteral>(
	query: SelectQueryBuilder<T>,
	relation: string,
	alias: string,
): SelectQueryBuilder<T> {
	const withDeleted = query.expressionMap.withDeleted;
	query.expressionMap.withDeleted = true;

	query
		.leftJoin(relation, alias)
		.addSelect([`${alias}.id`, `${alias}.login`])
		.leftJoin(`${alias}.member`, `${alias}Member`)
		.addSelect([`${alias}Member.id`, `${alias}Member.nickname`]);

	query.expressionMap.withDeleted = withDeleted;
	return query;
}
