import { AcEntity } from "./ac-entity";

export type RouteStoreItem = {
  entity: AcEntity<any, any>;
  method: string | symbol;
  controller: any;
  handler: any;
};

export const RouteStore: RouteStoreItem[] = [];
