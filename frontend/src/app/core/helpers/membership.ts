import { SDK } from "src/sdk";

/**
 * Membership = the yearly membership fee ("členský příspěvek").
 *
 * `member.membership` lists the years the fee is paid for — `[2026, 2028]` means paid for 2026 and
 * 2028 ("zaplaceno") and unpaid for everything else ("nezaplaceno"). The years are stored as
 * themselves, so nothing has to know where the list starts and there is no last year it can reach.
 *
 * Nothing else should search the list by hand — go through {@link isMembershipPaid} so
 * "is the membership paid?" is answered in one place. Mirrors `backend/src/helpers/membership.ts`.
 */

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

/** The membership of `year` (the current year by default) as the value the UI shows. */
export function membershipState(
	membership?: number[] | null,
	year: number = currentMembershipYear(),
): SDK.MembershipPaymentStatesEnum {
	return isMembershipPaid(membership, year) ? "zaplaceno" : "nezaplaceno";
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
