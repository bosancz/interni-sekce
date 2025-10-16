import { Permission } from "src/access-control/schema/route-acl";
import { MemberResponse } from "../dto/member.dto";
import { MemberReadPermission, MemberUpdatePermission } from "./members.acl";

export const MemberInsuranceCardReadPermission = new Permission({
	linkTo: MemberResponse,
	inherit: MemberReadPermission,
	applicable: (member) => !!member.insuranceCardFile,
});

export const MemberInsuranceCardUploadPermission = new Permission({
	linkTo: MemberResponse,
	inherit: MemberUpdatePermission,
});

export const MemberInsuranceCardDeletePermission = new Permission<MemberResponse>({
	linkTo: MemberResponse,
	inherit: MemberUpdatePermission,
	applicable: (member) => !!member.insuranceCardFile,
});
