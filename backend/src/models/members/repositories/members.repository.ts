import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { PaginationOptions } from "src/helpers/pagination";
import { Brackets, FindOneOptions, Repository } from "typeorm";
import { MemberContact } from "../entities/member-contact.entity";
import { Member } from "../entities/member.entity";

export interface GetMembersOptions extends PaginationOptions {
	groups?: number[];
	search?: string;
	roles?: string[];
	membership?: string[];
	age?: number[];
}

@Injectable()
export class MembersRepository {
	constructor(
		@InjectRepository(Member) private membersRepository: Repository<Member>,
		@InjectRepository(MemberContact) private membersContactsRepository: Repository<MemberContact>,
	) {}

	async getMembers(options: GetMembersOptions = {}, where: Brackets | string = "1=1") {
		const q = this.membersRepository
			.createQueryBuilder("members")
			// row-level permission filter (see Permission.canWhere)
			.where(where)
			.orderBy("CONCAT(members.nickname,members.first_name,members.last_name)", "ASC")
			.take(options.limit)
			.skip(options.offset);

		if (options.groups) q.andWhere("members.groupId IN (:...groupIds)", { groupIds: options.groups });

		if (options.search)
			q.andWhere(
				"members.nickname ILIKE :search OR members.firstName ILIKE :search OR members.lastName ILIKE :search",
				{
					search: `%${options.search}%`,
				},
			);

		if (options.roles) q.andWhere("members.role IN (:...roles)", { roles: options.roles });

		if (options.membership?.length) q.andWhere("members.membership IN (:...membership)", { membership: options.membership });

		if (options.age?.length)
			q.andWhere(
				"members.birthday IS NOT NULL AND DATE_PART('year', AGE(CURRENT_DATE, members.birthday))::int IN (:...ages)",
				{ ages: options.age },
			);

		return q.getMany();
	}

	async getMember(id: number, options?: FindOneOptions<Member>) {
		return this.membersRepository.findOne({ where: { id }, ...options });
	}

	async createMember(memberData: Partial<Omit<Member, "id">>) {
		return this.membersRepository.save(memberData);
	}

	async updateMember(id: number, memberData: Partial<Omit<Member, "id">>) {
		return this.membersRepository.update(id, memberData);
	}

	async deleteMember(id: number) {
		return this.membersRepository.softDelete({ id });
	}

	async createContact(memberId: number, contactData: Partial<Omit<MemberContact, "id">>) {
		return this.membersContactsRepository.save({ ...contactData, memberId });
	}

	async getContact(memberId: number, contactId: number) {
		return this.membersContactsRepository.findOne({ where: { id: contactId, memberId } });
	}

	async updateContact(memberId: number, contactId: number, contactData: Partial<Omit<MemberContact, "id">>) {
		return this.membersContactsRepository.save({ ...contactData, id: contactId, memberId });
	}

	async deleteContact(memberId: number, contactId: number) {
		return this.membersContactsRepository.delete({ id: contactId, memberId });
	}
}
