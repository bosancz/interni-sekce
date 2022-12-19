import { applyDecorators, SetMetadata, UseInterceptors } from "@nestjs/common";
import { ACL } from "../access-control-list";
import { AcEntityInterceptor } from "../interceptors/ac-entity.interceptor";

export type EntitiesStoreRoute = {
  entity: keyof typeof ACL;
  method: string;
  controller: any;
  handler: any;
};

export const EntitiesStore: EntitiesStoreRoute[] = [];

export function AcEntity(entity: keyof typeof ACL) {
  return (target: any, method: string, descriptor: PropertyDescriptor) => {
    EntitiesStore.push({
      entity,
      method,
      controller: target,
      handler: descriptor.value,
    });

    return applyDecorators(SetMetadata("entity", entity), UseInterceptors(AcEntityInterceptor))(target, method, descriptor);
  };
}
