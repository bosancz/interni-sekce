import { AcEntity } from "src/access-control/access-control-lib/schema/ac-entity";
import { Roles } from "./roles";

export type RouteEntity<DOC = unknown, DATA = {}> = AcEntity<Roles, DOC, DATA>;
