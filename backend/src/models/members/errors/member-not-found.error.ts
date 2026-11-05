export class MemberNotFoundError extends Error {
	constructor(public readonly memberId: number) {
		super(`Member ${memberId} not found.`);
		this.name = "MemberNotFoundError";
	}
}
