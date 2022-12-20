import { ChildEntity } from "./child-entities";

export type EntityStoreItem = {
  name: string;
  method: string | symbol;
  controller: any;
  handler: any;
  path?: string | ((doc: any) => string);
  filter?: (doc: any) => boolean;
  children?: ChildEntity;
};

export const EntityStore: EntityStoreItem[] = [];
