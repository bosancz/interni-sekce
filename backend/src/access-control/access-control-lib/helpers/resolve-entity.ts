import { EntityType } from "../schema/entity-type";

export function resolveEntity(entity: EntityType | (() => EntityType)): EntityType {
	if (typeof entity === "function" && entity.name === "") {
		return (<() => EntityType>entity)();
	} else {
		return <EntityType>entity;
	}
}
