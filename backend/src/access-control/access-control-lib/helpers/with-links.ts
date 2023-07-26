import { ApiProperty, IntersectionType } from "@nestjs/swagger";
// @ts-ignore
import { Type } from "@nestjs/common";
import { RouteStore } from "../route-store";
import { AcLink } from "../schema/ac-link";
import { EntityType } from "../schema/entity-type";
import { resolveEntity } from "./resolve-entity";

export type TypeWithLinks<T extends Type<any>> = Type<InstanceType<T> & { _links: { [key: string]: AcLink } }>;

export function WithLinks<T extends EntityType>(entity: T | (() => T)): () => TypeWithLinks<T> {
  function type() {
    class ResponseLinksObject {
      constructor() {}
    }

    class ResponseLinksProperty {
      constructor() {}
      @ApiProperty({ type: ResponseLinksObject }) _links!: ResponseLinksObject;
    }

    const resolvedEntity = resolveEntity(entity);

    if (!entity)
      throw new Error(
        `Entity not found, possible problem might be circular depenency. In this case use () => Enitity instead of Entity in the WithLinks helper.`,
      );

    const linkedRoutes = RouteStore.filter((r) => r.acl.options.linkTo === resolvedEntity);

    const decoratorFactory = ApiProperty({ type: AcLink });

    for (const route of linkedRoutes) {
      (<any>ResponseLinksObject).prototype[route.method] = undefined;
      decoratorFactory(ResponseLinksObject.prototype, route.method);
    }

    Object.defineProperty(ResponseLinksObject, "name", {
      value: `${resolvedEntity.name}Links`,
    });

    const EntityWithLinks = IntersectionType(resolvedEntity, ResponseLinksProperty);

    Object.defineProperty(EntityWithLinks, "name", {
      value: `${resolvedEntity.name}WithLinks`,
    });

    return EntityWithLinks;
  }

  return type;
}
