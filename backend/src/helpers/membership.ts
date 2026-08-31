/**
 * Membership = the yearly membership fee ("členský příspěvek"), stored per year.
 *
 * `Member.membership` is a fixed-length array of booleans: index 0 is {@link MEMBERSHIP_FIRST_YEAR}
 * and every following index is the next year, preallocated up to {@link MEMBERSHIP_LAST_YEAR}.
 * `true` = the fee for that year is paid ("zaplaceno"), `false` = it is not ("nezaplaceno").
 *
 * Nothing outside this file should index the array by hand — go through {@link isMembershipPaid}
 * (or {@link membershipPaidExpression} in SQL) so "is the membership paid?" is answered in one place.
 * The frontend mirrors these helpers in `src/app/core/helpers/membership.ts`.
 */

export const MEMBERSHIP_FIRST_YEAR = 2026;
export const MEMBERSHIP_LAST_YEAR = 2126;
export const MEMBERSHIP_YEARS_COUNT = MEMBERSHIP_LAST_YEAR - MEMBERSHIP_FIRST_YEAR + 1;

/** The two values a membership year can have, as used by filters and by the UI. */
export enum MembershipPaymentStates {
	"zaplaceno" = "zaplaceno",
	"nezaplaceno" = "nezaplaceno",
}

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

/** Pad/truncate a stored (or incoming) array to the preallocated length. */
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

/**
 * SQL counterpart of {@link isMembershipPaid} for query builders — a boolean expression over the
 * membership column. Postgres arrays are 1-based, hence the `+ 1`; years outside the preallocated
 * range (and rows with a shorter array) are unpaid.
 */
export function membershipPaidExpression(column: string, year: number = currentMembershipYear()): string {
	const index = membershipYearIndex(year);
	if (index === null) return "FALSE";
	return `COALESCE(${column}[${index + 1}], FALSE)`;
}
