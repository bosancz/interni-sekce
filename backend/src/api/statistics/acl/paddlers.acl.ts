import { Permission } from "src/access-control/schema/route-acl";
import { RootResponse } from "src/api/root/dto/root-response";

export const PadlersRankingPermission = new Permission<void>({
	linkTo: RootResponse,

	allowed: {
		vedouci: true,
	},
});

export const PadlersTotalsPermission = new Permission<void>({
	linkTo: RootResponse,

	allowed: {
		vedouci: true,
	},
});
