import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { PaginationOptions } from "src/helpers/pagination";
import { toPrefixTsQuery } from "src/helpers/search";
import { applySort } from "src/helpers/sort";
import { Brackets, FindOneOptions, Repository } from "typeorm";
import { MemberContact } from "../entities/member-contact.entity";
import { Member } from "../entities/member.entity";

export interface GetMembersOptions extends PaginationOptions {
	groups?: number[];
	search?: string;
	roles?: string[];
	membership?: string[];
	age?: number[];
	active?: boolean;
	contacts?: boolean;
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
			.where(where)
			.take(options.limit)
			.skip(options.offset);

		q.addSelect("CONCAT(members.nickname,members.first_name,members.last_name)", "sort_nickname")
			.addSelect("CONCAT(members.last_name,members.first_name)", "sort_name")
			.addSelect("DATE_PART('year', AGE(CURRENT_DATE, members.birthday))", "sort_age")
			.addSelect("(SELECT g.name FROM groups g WHERE g.id = members.group_id)", "sort_group");

		applySort(
			q,
			options,
			{
				nickname: "sort_nickname",
				name: "sort_name",
				role: "members.role",
				membership: "members.membership",
				age: "sort_age",
				birthday: "members.birthday",
				group: "sort_group",
				city: "members.addressCity",
				street: "members.addressStreet",
				status: "members.active",
			},
			{ column: "sort_nickname", order: "ASC" },
		);

		if (options.sort === "group") {
			q.addOrderBy("sort_nickname", "ASC");
		}

		if (options.contacts) q.leftJoinAndSelect("members.contacts", "contacts");

		if (options.groups) q.andWhere("members.groupId IN (:...groupIds)", { groupIds: options.groups });

		if (options.search) {
			const search = toPrefixTsQuery(options.search);
			if (search)
				q.andWhere(
					new Brackets((qb) =>
						qb
							.where("members.searchVector @@ to_tsquery('simple_unaccent', :search)")
							.orWhere(
								"EXISTS (SELECT 1 FROM members_contacts mc WHERE mc.member_id = members.id AND mc.search_vector @@ to_tsquery('simple_unaccent', :search))",
							),
					),
					{ search },
				);
		}

		if (options.roles) q.andWhere("members.role IN (:...roles)", { roles: options.roles });

		if (options.membership?.length)
			q.andWhere("members.membership IN (:...membership)", { membership: options.membership });

		if (options.age?.length)
			q.andWhere(
				"members.birthday IS NOT NULL AND DATE_PART('year', AGE(CURRENT_DATE, members.birthday))::int IN (:...ages)",
				{ ages: options.age },
			);

		if (options.active !== undefined) q.andWhere("members.active = :active", { active: options.active });

		return q.getMany();
	}

	async getMemberAges(where: Brackets | string = "1=1"): Promise<number[]> {
		const rows = await this.membersRepository
			.createQueryBuilder("members")
			.select("DISTINCT DATE_PART('year', AGE(CURRENT_DATE, members.birthday))::int", "age")
			.where(where)
			.andWhere("members.birthday IS NOT NULL")
			.orderBy("age", "ASC")
			.getRawMany<{ age: number }>();

		return rows.map((row) => Number(row.age)).filter((age) => Number.isFinite(age));
	}

	async getMember(id: number, options?: FindOneOptions<Member>) {
		return this.membersRepository.findOne({ where: { id }, ...options });
	}

	async getDeletedMembers(where: Brackets | string = "1=1") {
		return this.membersRepository
			.createQueryBuilder("members")
			.withDeleted()
			.where(where)
			.andWhere("members.deletedAt IS NOT NULL")
			.orderBy("members.deletedAt", "DESC")
			.getMany();
	}

	async getDeletedMember(id: number) {
		return this.membersRepository.findOne({ where: { id }, withDeleted: true });
	}

	async restoreMember(id: number) {
		return this.membersRepository.restore({ id });
	}

	async hardDeleteMember(id: number) {
		return this.membersRepository.delete({ id });
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
