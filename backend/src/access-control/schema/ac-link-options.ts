import { AcEntity } from "./ac-entity";

export interface ChildEntityArray {
  /** This hierarchy level is array of documents of ChildEntity type */
  array: ChildEntity;
}
export interface ChildEntityObject {
  /** ACL Entity of the current hiearchy level */
  entity?: AcEntity<any, any>;
  /** ChildEntity types of documents in properties of the current hiearchy level */
  properties?: { [property: string]: ChildEntity };
}

export type ChildEntity = ChildEntityArray | ChildEntityObject;

/**
 * Options for _links generation
 */
export interface AcLinksOptions<T = any> {
  /** Name for the current route. When not provided method name is used. */
  name?: string;
  /** Entities contained within main response entity */
  contains?: ChildEntity;
  /** Function to generate path, used if path needs params. */
  path?: (doc: T) => any;
  /** Show this path in _links only for documents matching filter */
  filter?: (doc: T) => boolean;
}
