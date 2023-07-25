import { Type } from "@nestjs/common";
import { EntityStore } from "../entity-store";

export interface AcEntityOptions {
  entity: Type<any>;
  isArray?: boolean;
}

export function AcEntity(entity: Type<any>, options?: Omit<AcEntityOptions, "entity">): PropertyDecorator;
export function AcEntity(options: AcEntityOptions): PropertyDecorator;
export function AcEntity(
  entityOrOptions: Type<any> | AcEntityOptions,
  additionalOptions: PartialBy<AcEntityOptions, "entity"> = {},
): PropertyDecorator {
  const options =
    typeof entityOrOptions === "function" ? { entity: entityOrOptions, ...additionalOptions } : { ...entityOrOptions };

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
