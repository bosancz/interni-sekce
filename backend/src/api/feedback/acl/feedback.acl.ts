import { AcAllowed } from "src/access-control/access-control-lib/schema/ac-route-acl";
import { Roles } from "src/access-control/schema/roles";
import { Permission } from "src/access-control/schema/route-acl";
import { RootResponse } from "src/api/root/dto/root-response";

// Any logged-in user can report a bug.
export const allowed: AcAllowed<void, Roles> = {
	uzivatel: true,
};

export const SendBugReportPermission = new Permission<void>({
	linkTo: RootResponse,
	allowed,
});
