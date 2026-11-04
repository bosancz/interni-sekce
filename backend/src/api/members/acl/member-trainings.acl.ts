import { Permission } from "src/access-control/schema/route-acl";
import { RootResponse } from "src/api/root/dto/root-response";
import { MemberTrainingResponse } from "../dto/member-training.dto";
import { MemberResponse } from "../dto/member.dto";
import { MemberReadPermission, MemberUpdatePermission } from "./members.acl";

export const MemberTrainingsListPermission = new Permission({
	linkTo: MemberResponse,
	contains: MemberTrainingResponse,
	params: { memberId: "id" },
	inherit: MemberReadPermission,
});

export const MemberTrainingCreatePermission = new Permission({
	linkTo: MemberResponse,
	contains: MemberTrainingResponse,
	params: { memberId: "id" },
	inherit: MemberUpdatePermission,
});

export const MemberTrainingUpdatePermission = new Permission({
	linkTo: MemberTrainingResponse,
	contains: MemberTrainingResponse,
	params: { trainingId: "id" },
	allowed: { vedouci: true },
});

export const MemberTrainingDeletePermission = new Permission({
	linkTo: MemberTrainingResponse,
	params: { trainingId: "id" },
	allowed: { vedouci: true },
});

export const MemberTrainingsBulkCreatePermission = new Permission<void>({
	linkTo: RootResponse,
	contains: MemberTrainingResponse,
	allowed: { vedouci: true },
});
