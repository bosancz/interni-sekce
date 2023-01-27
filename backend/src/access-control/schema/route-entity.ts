import { AcRouteEntity } from "../access-control-lib/schema/ac-route-entity";
import { Roles } from "./roles";

export type RouteEntity<DOC = unknown, DATA = {}> = AcRouteEntity<Roles, DOC, DATA>;
