import { applyDecorators, SetMetadata, UseInterceptors } from "@nestjs/common";
import { AcEntityInterceptor } from "../interceptors/ac-entity.interceptor";
import { ContainingEntity } from "../schema/containing-entities";
import { EntitiesStore } from "../schema/entities-store";

export interface AcEntityOptions<T> {
  type?: ContainingEntity;
  path?: string | ((doc: T) => string);
  filter?: (doc: T) => boolean;
}

export function AcEntity<T = any>(entity: string, options: AcEntityOptions<T> = {}): MethodDecorator {
  return (target: any, method: string, descriptor: PropertyDescriptor) => {
    EntitiesStore.push({
      entity,
      method,
      path: options.path,
      controller: target,
      handler: descriptor.value,
      filter: options.filter,
    });

    return applyDecorators(
      SetMetadata("entity", entity),
      SetMetadata("containing-entities", options.type),
      UseInterceptors(AcEntityInterceptor),
    )(target, method, descriptor);
  };
}
