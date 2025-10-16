import { Permission } from "src/access-control/schema/route-acl";
import { MemberResponse } from "../dto/member.dto";
import { MemberReadRoute, MemberUpdateRoute } from "./members.acl";

export const MemberInsuranceCardReadRoute = new Permission({
	linkTo: MemberResponse,
	inherit: MemberReadRoute,
	applicable: (member) => !!member.insuranceCardFile,
});

export const MemberInsuranceCardUploadRoute = new Permission({
	linkTo: MemberResponse,
	inherit: MemberUpdateRoute,
});

export const MemberInsuranceCardDeleteRoute = new Permission<MemberResponse>({
	linkTo: MemberResponse,
	inherit: MemberUpdateRoute,
	applicable: (member) => !!member.insuranceCardFile,
});
