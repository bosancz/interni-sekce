import { ConflictException, UnprocessableEntityException } from "@nestjs/common";
import {
	ActiveGroupMembershipExistsError,
	GroupMembershipYearsError,
	GroupNotFoundError,
} from "src/models/members/errors/group-membership.errors";

export function rethrowGroupMembershipErrors(err: unknown): never {
	if (err instanceof ActiveGroupMembershipExistsError)
		throw new ConflictException("Člen už je aktivní v jiném oddílu. Nejdřív u něj vyplň rok do.");
	if (err instanceof GroupMembershipYearsError)
		throw new UnprocessableEntityException("Rok do nemůže být dřív než rok od.");
	if (err instanceof GroupNotFoundError) throw new UnprocessableEntityException("Oddíl neexistuje.");
	throw err;
}
