import { EntityStore } from "../entity-store";
import { EntityType } from "../schema/entity-type";

export interface AcEntityOptions {
	entity: EntityType;
	isArray?: boolean;
}

export function AcEntity(entity: EntityType, options?: Omit<AcEntityOptions, "entity">): PropertyDecorator;
export function AcEntity(options: AcEntityOptions): PropertyDecorator;
export function AcEntity(
	entityOrOptions: EntityType | AcEntityOptions,
	additionalOptions: PartialBy<AcEntityOptions, "entity"> = {},
): PropertyDecorator {
	const options =
		typeof entityOrOptions === "function"
			? { entity: entityOrOptions, ...additionalOptions }
			: { ...entityOrOptions };

	return (target: Object, propertyKey: string | symbol) => {
		let entity = EntityStore.find((e) => e.entity === target);

		if (!entity) {
			entity = {
				entity: target.constructor,
				properties: {},
			};
			EntityStore.push(entity);
		}

		entity.properties[String(propertyKey)] = options;
	};
}
