import { Type } from "@nestjs/common";
import { ApiProperty, IntersectionType } from "@nestjs/swagger";
// @ts-ignore
import { RouteStore } from "../route-store";
import { AcLink } from "../schema/ac-link";

export function WithLinks(entity: Type<any>) {
  function type() {
    console.log(entity, RouteStore.length);
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
      value: `${entity.name}Links`,
    });

    const EntityWithLinks = IntersectionType(entity, ResponseLinksProperty);

    Object.defineProperty(EntityWithLinks, "name", {
      value: `${entity.name}WithLinks`,
    });

    return EntityWithLinks;
  }

  return type;
}
