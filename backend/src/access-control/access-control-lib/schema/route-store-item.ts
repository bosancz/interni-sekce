import { AcRouteACL } from "./ac-route-acl";

export type RouteStoreItem = {
  acl: AcRouteACL<any>;
  method: string | symbol;
  controller: any;
  handler: any;
  httpMethod: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  name: string;
};
