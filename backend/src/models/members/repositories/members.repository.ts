import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { PaginationOptions } from "src/helpers/pagination";
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
	// eagerly load each member's contacts in the same query (avoids N+1 per-member fetches)
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
			// row-level permission filter (see Permission.canWhere)
			.where(where)
			.take(options.limit)
			.skip(options.offset);

		applySort(
			q,
			options,
			{
				nickname: "CONCAT(members.nickname,members.first_name,members.last_name)",
				name: "CONCAT(members.last_name,members.first_name)",
				role: "members.role",
				membership: "members.membership",
				age: "DATE_PART('year', AGE(CURRENT_DATE, members.birthday))",
				birthday: "members.birthday",
				// Sort by the *displayed* group (its name, e.g. "6. oddíl"), not the internal group
				// id. `groups.name` carries the `natural_numeric` ICU collation (see Group entity),
				// so embedded numbers order naturally: "3. oddíl" precedes "22. oddíl", and
				// non-numeric names ("Klub přátel", …) sort after them.
				group: "(SELECT g.name FROM groups g WHERE g.id = members.group_id)",
				city: "members.addressCity",
				street: "members.addressStreet",
				status: "members.active",
			},
			{ column: "CONCAT(members.nickname,members.first_name,members.last_name)", order: "ASC" },
		);

		// Keep members within the same group in a readable order.
		if (options.sort === "group") {
			q.addOrderBy("CONCAT(members.nickname,members.first_name,members.last_name)", "ASC");
		}

		// Join contacts up-front only when requested (i.e. the contacts column is visible).
		// TypeORM keeps pagination correct with a distinct-id subquery despite the one-to-many join.
		if (options.contacts) q.leftJoinAndSelect("members.contacts", "contacts");

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

		if (options.active !== undefined) q.andWhere("members.active = :active", { active: options.active });

		return q.getMany();
	}

	// Distinct ages across all members in a single query, so the age filter no longer
	// needs to page through the entire members table client-side.
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

	// Soft-deleted members only (deletedAt IS NOT NULL). withDeleted() lifts TypeORM's default
	// filter that hides them, and the explicit condition keeps the live members out.
	async getDeletedMembers(where: Brackets | string = "1=1") {
		return this.membersRepository
			.createQueryBuilder("members")
			.withDeleted()
			.where(where)
			.andWhere("members.deletedAt IS NOT NULL")
			.orderBy("members.deletedAt", "DESC")
			.getMany();
	}

	// Fetch a single member including soft-deleted ones, so restore/permanent-delete can run their
	// permission checks against a member the normal (non-deleted) query would no longer return.
	async getDeletedMember(id: number) {
		return this.membersRepository.findOne({ where: { id }, withDeleted: true });
	}

	// Clear deletedAt, bringing a soft-deleted member back to life.
	async restoreMember(id: number) {
		return this.membersRepository.restore({ id });
	}

	// Irreversibly remove the row from the database (as opposed to deleteMember's soft delete).
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
