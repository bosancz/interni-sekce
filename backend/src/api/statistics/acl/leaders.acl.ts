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

/**
 * Drill-down into one leader's events. Not exposed as a root link — the route takes a member id, and
 * the block that opens it is already gated by {@link TopLeadersPermission}.
 */
export const LeaderEventsPermission = new Permission<void>({
	linkTo: RootResponse,

	allowed: {
		vedouci: true,
	},
});
