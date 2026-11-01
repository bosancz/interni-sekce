import { Permission } from "src/access-control/schema/route-acl";
import { MemberAchievementResponse } from "../dto/member-achievement.dto";
import { MemberResponse } from "../dto/member.dto";
import { MemberReadPermission, MemberUpdatePermission } from "./members.acl";

export const MemberAchievementsListPermission = new Permission({
	linkTo: MemberResponse,
	contains: MemberAchievementResponse,
	params: { memberId: "id" },
	inherit: MemberReadPermission,
});

export const MemberAchievementCreatePermission = new Permission({
	linkTo: MemberResponse,
	contains: MemberAchievementResponse,
	params: { memberId: "id" },
	inherit: MemberUpdatePermission,
});

export const MemberAchievementUpdatePermission = new Permission({
	linkTo: MemberAchievementResponse,
	contains: MemberAchievementResponse,
	params: { achievementId: "id" },
	allowed: { vedouci: true },
});

export const MemberAchievementDeletePermission = new Permission({
	linkTo: MemberAchievementResponse,
	params: { achievementId: "id" },
	allowed: { vedouci: true },
});
