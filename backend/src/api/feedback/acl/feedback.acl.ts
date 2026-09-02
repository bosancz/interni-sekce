import { AcAllowed } from "src/access-control/access-control-lib/schema/ac-route-acl";
import { Roles } from "src/access-control/schema/roles";
import { Permission } from "src/access-control/schema/route-acl";
import { RootResponse } from "src/api/root/dto/root-response";
import { BugReportResponse } from "../dto/bug-report-response.dto";

export const allowed: AcAllowed<void, Roles> = {
	uzivatel: true,
};

export const SendBugReportPermission = new Permission<void>({
	linkTo: RootResponse,
	allowed,
});

export const ListBugReportsPermission = new Permission<void>({
	linkTo: RootResponse,
	contains: BugReportResponse,
	allowed,
});
