import { applyDecorators, SetMetadata, UseInterceptors } from "@nestjs/common";
import { AcEntityInterceptor } from "../interceptors/ac-entity.interceptor";
import { ChildEntity } from "../schema/child-entities";
import { EntityStore, EntityStoreItem } from "../schema/entity-store";

export interface AcEntityOptions<T> {
  children?: ChildEntity;
  path?: string | ((doc: T) => string);
  filter?: (doc: T) => boolean;
}

export function AcEntity<T = any>(name: string, options: AcEntityOptions<T> = {}): MethodDecorator {
  return (target: any, method: string, descriptor: PropertyDescriptor) => {
    const entity: EntityStoreItem = {
      name,
      method,
      controller: target,
      handler: descriptor.value,
      path: options.path,
      filter: options.filter,
      children: options.children,
    };

    EntityStore.push(entity);

    return applyDecorators(SetMetadata("entity", entity), UseInterceptors(AcEntityInterceptor))(target, method, descriptor);
  };
}
