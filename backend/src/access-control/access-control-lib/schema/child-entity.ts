import { AcEntity } from "./ac-entity";

export interface ChildEntityArray<T extends any[]> {
  /** This hierarchy level is array of documents of ChildEntity type */
  array: ChildEntity<T[0]>;
}
export interface ChildEntityObject<T> {
  /** ACL Entity of the current hiearchy level */
  entity?: AcEntity<T>;
  /** ChildEntity types of documents in properties of the current hiearchy level */
  properties?: { [property in keyof T]?: ChildEntity<any> }; // TODO: is there a way to say if property is A, then value is T[A]?
}

export type ChildEntity<T> = T extends any[] ? ChildEntityArray<T> : ChildEntityObject<T>;
