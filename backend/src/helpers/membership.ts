import { MembershipPayment } from "src/models/members/entities/membership-payment.entity";

/**
 * Membership = the yearly membership fee ("členský příspěvek").
 *
 * `Member.membership` is the list of fees the member has paid — one {@link MembershipPayment} per
 * season, carrying the variable symbol, the amount and the day it was recorded. A season is
 * "zaplaceno" exactly when it has a payment and "nezaplaceno" when it has none, so there is no
 * first or last season the list can reach and nothing to keep in step with a separate flag.
 *
 * Nothing outside this file should search the list by hand — go through {@link isMembershipPaid}
 * (or {@link membershipPaidExpression} in SQL) so "is the membership paid?" is answered in one place.
 * The frontend mirrors these helpers in `src/app/core/helpers/membership.ts`.
 */

/** The two values a membership year can have, as used by filters and by the UI. */
export enum MembershipPaymentStates {
	"zaplaceno" = "zaplaceno",
	"nezaplaceno" = "nezaplaceno",
}

/** The year "the current membership" refers to. */
export function currentMembershipYear(): number {
	return new Date().getFullYear();
}

/** The payment of `year` (the current year by default), or undefined when the fee is unpaid. */
export function membershipPaymentOf(
	membership?: MembershipPayment[] | null,
	year: number = currentMembershipYear(),
): MembershipPayment | undefined {
	return membership?.find((payment) => payment.forYear === year);
}

/**
 * The universal membership check: is the fee for `year` (the current year by default) paid?
 */
export function isMembershipPaid(
	membership?: MembershipPayment[] | null,
	year: number = currentMembershipYear(),
): boolean {
	return !!membershipPaymentOf(membership, year);
}

/**
 * SQL counterpart of {@link isMembershipPaid} for query builders — a boolean expression over the
 * membership payments of the member the query is about. It is a correlated EXISTS rather than a
 * join so it can be used next to pagination without multiplying the rows it filters.
 */
export function membershipPaidExpression(memberIdColumn: string, year: number = currentMembershipYear()): string {
	if (!Number.isInteger(year)) throw new Error(`Membership year must be an integer, got ${year}`);

	return `EXISTS (
		SELECT 1 FROM membership_payments mp
		WHERE mp.member_id = ${memberIdColumn} AND mp.for_year = ${year}
	)`;
}
