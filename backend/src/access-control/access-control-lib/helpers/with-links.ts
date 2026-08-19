import { ApiProperty, IntersectionType } from "@nestjs/swagger";
// @ts-ignore
import { Type } from "@nestjs/common";
import { RouteStore } from "../route-store";
import { AcLink } from "../schema/ac-link";
import { EntityType } from "../schema/entity-type";
import { resolveEntity } from "./resolve-entity";

export type TypeWithLinks<T extends Type<any>> = Type<InstanceType<T> & { _links: { [key: string]: AcLink } }>;

const withLinksCache = new Map<string, Type<any>>();

export function WithLinks<E extends EntityType>(contains: E | (() => E)): () => TypeWithLinks<E>;
export function WithLinks<E extends EntityType, T extends Type>(
	contains: E | (() => E),
	type: T | (() => T),
): () => TypeWithLinks<T>;

export function WithLinks<T extends Type, E extends EntityType>(contains: E | (() => E), overrideType?: T | (() => T)) {
	function type() {
		const entity = resolveEntity(contains);
		const responseType = overrideType ? resolveEntity(overrideType) : entity;

		if (!entity)
			throw new Error(
				`Entity not found, possible problem might be circular depenency. In this case use () => Enitity instead of Entity in the WithLinks helper.`,
			);

		const cacheKey = `${responseType.name}WithLinks`;
		if (withLinksCache.has(cacheKey)) return withLinksCache.get(cacheKey)!;

		class ResponseLinksObject {
			constructor() {}
		}

		class ResponseLinksProperty {
			constructor() {}
			@ApiProperty({ type: ResponseLinksObject }) _links!: ResponseLinksObject;
		}

		const linkedRoutes = RouteStore.filter((r) => r.acl.options.linkTo === entity);

		const decoratorFactory = ApiProperty({ type: AcLink });

		for (const route of linkedRoutes) {
			(<any>ResponseLinksObject).prototype[route.method] = undefined;
			decoratorFactory(ResponseLinksObject.prototype, route.method);
		}

		Object.defineProperty(ResponseLinksObject, "name", {
			value: `${responseType.name}Links`,
		});

		const ResponseWithLinks = IntersectionType(responseType, ResponseLinksProperty);

		Object.defineProperty(ResponseWithLinks, "name", {
			value: cacheKey,
		});

		withLinksCache.set(cacheKey, ResponseWithLinks);
		return ResponseWithLinks;
	}

	return type;
}
