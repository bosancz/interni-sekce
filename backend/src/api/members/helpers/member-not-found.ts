import { NotFoundException } from "@nestjs/common";
import { MemberNotFoundError } from "src/models/members/errors/member-not-found.error";

export function rethrowMemberNotFound(err: unknown): never {
	if (err instanceof MemberNotFoundError) throw new NotFoundException(err.message);
	throw err;
}
