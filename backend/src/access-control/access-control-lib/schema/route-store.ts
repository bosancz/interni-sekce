import { AcRouteACL } from "./ac-route-acl";

export type RouteStoreItem = {
  acl: AcRouteACL<any>;
  method: string | symbol;
  controller: any;
  handler: any;
};

export const RouteStore: RouteStoreItem[] = [];
