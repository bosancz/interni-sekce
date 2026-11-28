import { SDK } from "src/sdk";

export interface MemberGroup {
	id: number;
	active: boolean;
}

type Membership = Pick<SDK.GroupMembershipResponse, "id" | "groupId" | "active" | "yearFrom" | "yearTill">;

export function compareGroupMemberships(a: Membership, b: Membership) {
	return membershipOrder(a) - membershipOrder(b) || a.id - b.id;
}

export function getMemberGroups(
	member: Pick<SDK.MemberResponse, "groupId" | "groupMemberships"> | null | undefined,
): MemberGroup[] {
	if (!member) return [];

	const groups = new Map<number, MemberGroup>();
	for (const membership of [...(member.groupMemberships ?? [])].sort(compareGroupMemberships)) {
		const active = membership.active || !!groups.get(membership.groupId)?.active;
		groups.delete(membership.groupId);
		groups.set(membership.groupId, { id: membership.groupId, active });
	}

	if (member.groupId && !groups.has(member.groupId)) groups.set(member.groupId, { id: member.groupId, active: true });

	return [...groups.values()];
}

export function getMemberLastGroupId(
	member: Pick<SDK.MemberResponse, "groupId" | "groupMemberships"> | null | undefined,
): number | null {
	return getMemberGroups(member).at(-1)?.id ?? null;
}

function membershipOrder(membership: Membership) {
	if (membership.active) return Number.MAX_SAFE_INTEGER;
	return membership.yearTill ?? membership.yearFrom ?? Number.MIN_SAFE_INTEGER;
}
