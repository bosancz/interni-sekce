export class GroupNotFoundError extends Error {
	constructor(public readonly groupId: number) {
		super(`Group ${groupId} not found.`);
		this.name = "GroupNotFoundError";
	}
}

export class ActiveGroupMembershipExistsError extends Error {
	constructor(public readonly memberId: number) {
		super(`Member ${memberId} already has an active group membership.`);
		this.name = "ActiveGroupMembershipExistsError";
	}
}

export class GroupMembershipYearsError extends Error {
	constructor(
		public readonly yearFrom: number,
		public readonly yearTill: number,
	) {
		super(`Group membership cannot end (${yearTill}) before it starts (${yearFrom}).`);
		this.name = "GroupMembershipYearsError";
	}
}
