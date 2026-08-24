import { Permission } from "src/access-control/schema/route-acl";
import { MemberResponse } from "../dto/member.dto";
import { MemberReadPermission, MemberUpdatePermission } from "./members.acl";

export const MemberInsuranceCardReadPermission = new Permission({
	linkTo: MemberResponse,
	params: { memberId: "id" },
	inherit: MemberReadPermission,
	applicable: ({ doc }) => !!doc.insuranceCardFile,
});

export const MemberInsuranceCardUploadPermission = new Permission({
	linkTo: MemberResponse,
	params: { memberId: "id" },
	inherit: MemberUpdatePermission,
});

export const MemberInsuranceCardDeletePermission = new Permission<MemberResponse>({
	linkTo: MemberResponse,
	params: { memberId: "id" },
	inherit: MemberUpdatePermission,
	applicable: ({ doc }) => !!doc.insuranceCardFile,
});
