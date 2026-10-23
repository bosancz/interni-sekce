import { Permission } from "src/access-control/schema/route-acl";
import { RootResponse } from "src/api/root/dto/root-response";
import { BackupsSummaryResponse } from "../dto/backup.dto";

export const BackupsSummaryPermission = new Permission<void>({
	linkTo: RootResponse,
	contains: BackupsSummaryResponse,
	allowed: {
		admin: true,
	},
});
