import { Request } from "express";

export interface AccessControlLibOptions {
  linksProperty?: string;
  getUserRoles?: (req: Request) => string[];
  routeNameConvention?: (methodName: string) => string;
}
