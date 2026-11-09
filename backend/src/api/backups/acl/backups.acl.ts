import { Permission } from "src/access-control/schema/route-acl";
import { RootResponse } from "src/api/root/dto/root-response";
import { BackupRunResponse, BackupsSummaryResponse } from "../dto/backup.dto";

export const BackupsSummaryPermission = new Permission<void>({
	linkTo: RootResponse,
	contains: BackupsSummaryResponse,
	allowed: {
		admin: true,
	},
});

export const BackupRunsListPermission = new Permission<void>({
	linkTo: RootResponse,
	contains: BackupRunResponse,
	allowed: {
		admin: true,
	},
});
