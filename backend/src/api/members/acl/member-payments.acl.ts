import { Permission } from "src/access-control/schema/route-acl";
import { MemberPaymentResponse } from "../dto/member-payment.dto";
import { MemberResponse } from "../dto/member.dto";
import { MemberReadPermission } from "./members.acl";

export const MemberPaymentsListPermission = new Permission({
	linkTo: MemberResponse,
	contains: MemberPaymentResponse,
	inherit: MemberReadPermission,
});

export const MemberPaymentsCreatePermission = new Permission({
	linkTo: MemberResponse,
	contains: MemberPaymentResponse,
	allowed: { admin: true },
});

export const MemberPaymentsUpdatePermission = new Permission({
	linkTo: MemberResponse,
	contains: MemberPaymentResponse,
	allowed: { admin: true },
});

export const MemberPaymentsDeletePermission = new Permission({
	linkTo: MemberPaymentResponse,
	allowed: { admin: true },
});
