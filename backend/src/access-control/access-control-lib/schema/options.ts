import { Request } from "express";

export interface AccessControlLibOptions {
	adminRole?: string;
	linksProperty?: string;
	getUserRoles?: (req: Request) => string[];
	routeNameConvention?: (methodName: string) => string;
}
