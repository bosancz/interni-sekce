import { applyDecorators, SetMetadata, UseInterceptors } from "@nestjs/common";
import { AcLinksInterceptor } from "../interceptors/ac-links.interceptor";
import { AcRouteACL } from "../schema/ac-route-acl";
import { MetadataConstant } from "../schema/metadata-constant";
import { RouteStore, RouteStoreItem } from "../schema/route-store";

/**
 * Adds _links field to response documents based on Access Control permissions
 * @param entity Access Control List entity
 * @param options Options for _links generation
 * @returns
 */
export function AcLinks<D, C>(acl: AcRouteACL<D, C>): MethodDecorator {
  return (target: any, method: string | symbol, descriptor: PropertyDescriptor) => {
    const routeStoreItem: RouteStoreItem = {
      acl,
      method,
      controller: target,
      handler: descriptor.value,
    };

    RouteStore.push(routeStoreItem);

    return applyDecorators(SetMetadata(MetadataConstant.route, routeStoreItem), UseInterceptors(AcLinksInterceptor))(
      target,
      method,
      descriptor,
    );
  };
}
