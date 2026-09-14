import { SDK } from "src/sdk";

export interface MembershipPaymentStateMetadata {
	title: string;
}

/**
 * The two values of the membership fee for a given year. Which one a member has is decided by
 * `isMembershipPaid()` (core/helpers/membership.ts) — this map only carries the labels.
 */
export const MembershipPaymentStates: {
	[state in SDK.MembershipPaymentStatesEnum]: MembershipPaymentStateMetadata;
} = {
	zaplaceno: {
		title: "Zaplaceno",
	},
	nezaplaceno: {
		title: "Nezaplaceno",
	},
};
