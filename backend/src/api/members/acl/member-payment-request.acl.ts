import { Permission } from "src/access-control/schema/route-acl";
import { MemberResponse } from "../dto/member.dto";
import { MemberReadPermission } from "./members.acl";

/**
 * The payment request is part of a member's detail, so whoever may read the member may ask
 * for their payment details.
 */
export const MemberPaymentRequestPermission = new Permission({
	linkTo: MemberResponse,
	inherit: MemberReadPermission,
});
