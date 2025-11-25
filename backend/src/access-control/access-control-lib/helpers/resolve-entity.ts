import { Type } from "@nestjs/common";

export function resolveEntity<E>(entity: Type<E> | (() => Type<E>)): Type<E> {
	if (typeof entity === "function" && entity.name === "") {
		return (<() => Type<E>>entity)();
	} else {
		return entity as Type<E>;
	}
}
