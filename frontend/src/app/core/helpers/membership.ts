import { SDK } from "src/sdk";

/**
 * Membership = the yearly membership fee ("členský příspěvek"), stored per year.
 *
 * `member.membership` is a fixed-length array of booleans: index 0 is {@link MEMBERSHIP_FIRST_YEAR}
 * and every following index is the next year, preallocated up to {@link MEMBERSHIP_LAST_YEAR}.
 * `true` = the fee for that year is paid ("zaplaceno"), `false` = it is not ("nezaplaceno").
 *
 * Nothing else should index the array by hand — go through {@link isMembershipPaid} so
 * "is the membership paid?" is answered in one place. Mirrors `backend/src/helpers/membership.ts`.
 */

export const MEMBERSHIP_FIRST_YEAR = 2026;
export const MEMBERSHIP_LAST_YEAR = 2126;
export const MEMBERSHIP_YEARS_COUNT = MEMBERSHIP_LAST_YEAR - MEMBERSHIP_FIRST_YEAR + 1;

/** The year "the current membership" refers to. */
export function currentMembershipYear(): number {
	return new Date().getFullYear();
}

/** Position of `year` in the membership array, or null when it is outside the preallocated range. */
export function membershipYearIndex(year: number): number | null {
	if (year < MEMBERSHIP_FIRST_YEAR || year > MEMBERSHIP_LAST_YEAR) return null;
	return year - MEMBERSHIP_FIRST_YEAR;
}

/** A fresh membership array: every preallocated year unpaid. */
export function createMembership(): boolean[] {
	return new Array<boolean>(MEMBERSHIP_YEARS_COUNT).fill(false);
}

/** Pad/truncate a membership array to the preallocated length. */
export function normalizeMembership(membership?: boolean[] | null): boolean[] {
	const years = createMembership();
	membership?.slice(0, MEMBERSHIP_YEARS_COUNT).forEach((paid, index) => (years[index] = paid === true));
	return years;
}

/**
 * The universal membership check: is the fee for `year` (the current year by default) paid?
 */
export function isMembershipPaid(membership?: boolean[] | null, year: number = currentMembershipYear()): boolean {
	const index = membershipYearIndex(year);
	return index !== null && membership?.[index] === true;
}

/** The membership of `year` (the current year by default) as the value the UI shows. */
export function membershipState(
	membership?: boolean[] | null,
	year: number = currentMembershipYear(),
): SDK.MembershipPaymentStatesEnum {
	return isMembershipPaid(membership, year) ? "zaplaceno" : "nezaplaceno";
}

/** Copy of `membership` with `year` (the current year by default) set to paid/unpaid. */
export function setMembershipPaid(
	membership: boolean[] | null | undefined,
	paid: boolean,
	year: number = currentMembershipYear(),
): boolean[] {
	const years = normalizeMembership(membership);
	const index = membershipYearIndex(year);
	if (index !== null) years[index] = paid;
	return years;
}
