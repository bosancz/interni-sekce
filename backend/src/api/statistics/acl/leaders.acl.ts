import { Permission } from "src/access-control/schema/route-acl";
import { RootResponse } from "src/api/root/dto/root-response";

/**
 * Linked to the root so the frontend can decide from `_links` whether to render the top-leaders
 * block on the dashboard at all.
 */
export const TopLeadersPermission = new Permission<void>({
	linkTo: RootResponse,

	allowed: {
		vedouci: true,
	},
});
