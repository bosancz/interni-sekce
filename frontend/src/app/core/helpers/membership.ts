import { SDK } from "src/sdk";

/**
 * Membership = the yearly membership fee ("členský příspěvek").
 *
 * `member.membership` is the list of fees the member has paid — one payment per season, carrying
 * the variable symbol and the day the treasurer recorded it. A season is "zaplaceno" exactly
 * when it has a payment and "nezaplaceno" when it has none, so there is no first or last season
 * the list can reach.
 *
 * Nothing else should search the list by hand — go through {@link isMembershipPaid} so
 * "is the membership paid?" is answered in one place. Mirrors `backend/src/helpers/membership.ts`.
 */

/** The year "the current membership" refers to. */
export function currentMembershipYear(): number {
	return new Date().getFullYear();
}

/** The payment of `year` (the current year by default), or undefined when the fee is unpaid. */
export function membershipPaymentOf(
	membership?: SDK.MembershipPaymentResponse[] | null,
	year: number = currentMembershipYear(),
): SDK.MembershipPaymentResponse | undefined {
	return membership?.find((payment) => payment.forYear === year);
}

/**
 * The universal membership check: is the fee for `year` (the current year by default) paid?
 */
export function isMembershipPaid(
	membership?: SDK.MembershipPaymentResponse[] | null,
	year: number = currentMembershipYear(),
): boolean {
	return !!membershipPaymentOf(membership, year);
}

/** The membership of `year` (the current year by default) as the value the UI shows. */
export function membershipState(
	membership?: SDK.MembershipPaymentResponse[] | null,
	year: number = currentMembershipYear(),
): SDK.MembershipPaymentStatesEnum {
	return isMembershipPaid(membership, year) ? "zaplaceno" : "nezaplaceno";
}
