/**
 * Membership = the yearly membership fee ("členský příspěvek").
 *
 * `Member.membership` lists the years the fee is paid for — `[2026, 2028]` means paid for 2026 and
 * 2028 ("zaplaceno") and unpaid for everything else ("nezaplaceno"). The years are stored as
 * themselves, so nothing has to know where the list starts and there is no last year it can reach.
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

/**
 * The universal membership check: is the fee for `year` (the current year by default) paid?
 */
export function isMembershipPaid(membership?: number[] | null, year: number = currentMembershipYear()): boolean {
	return membership?.includes(year) === true;
}

/**
 * Copy of `membership` with `year` (the current year by default) added when paid and removed when
 * not — kept sorted and without duplicates, so the stored list always reads as a list of years.
 */
export function setMembershipPaid(
	membership: number[] | null | undefined,
	paid: boolean,
	year: number = currentMembershipYear(),
): number[] {
	const years = new Set(membership ?? []);

	if (paid) years.add(year);
	else years.delete(year);

	return [...years].sort((a, b) => a - b);
}

/**
 * SQL counterpart of {@link isMembershipPaid} for query builders — a boolean expression over the
 * membership column. `@>` (array contains) is used rather than `= ANY(…)` because it is the form a
 * GIN index can serve, should the members table ever grow enough to want one.
 */
export function membershipPaidExpression(column: string, year: number = currentMembershipYear()): string {
	if (!Number.isInteger(year)) throw new Error(`Membership year must be an integer, got ${year}`);

	return `${column} @> ARRAY[${year}]::smallint[]`;
}
