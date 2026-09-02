import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { currentMembershipYear, MembershipPaymentStates, membershipPaidExpression } from "src/helpers/membership";
import { PaginationOptions } from "src/helpers/pagination";
import { toPrefixTsQuery } from "src/helpers/search";
import { applySort } from "src/helpers/sort";
import { Brackets, FindOneOptions, FindOptionsRelations, Repository } from "typeorm";
import { MemberContact } from "../entities/member-contact.entity";
import { Member } from "../entities/member.entity";
import { MembershipPayment } from "../entities/membership-payment.entity";

export interface GetMembersOptions extends PaginationOptions {
	groups?: number[];
	search?: string;
	roles?: string[];
	// "zaplaceno" / "nezaplaceno" (see helpers/membership.ts), asked about membershipYear
	membership?: string[];
	// Which year the membership filter and sort look at; defaults to the current one.
	membershipYear?: number;
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
		@InjectRepository(MembershipPayment) private membershipPaymentsRepository: Repository<MembershipPayment>,
	) {}

	async getMembers(options: GetMembersOptions = {}, where: Brackets | string = "1=1") {
		// Everything membership-related on this list — the filter, the sort — is asked about one
		// year, so the treasurer view can look back at previous seasons.
		const membershipPaid = membershipPaidExpression(
			"members.id",
			options.membershipYear ?? currentMembershipYear(),
		);

		const q = this.membersRepository
			.createQueryBuilder("members")
			// row-level permission filter (see Permission.canWhere)
			.where(where)
			.take(options.limit)
			.skip(options.offset);

		// Sorts that are an expression rather than a plain column are selected under an alias and
		// ordered by that alias. Combining the contacts join below with take/skip makes TypeORM
		// paginate through a distinct-id subquery, and it can only carry an ORDER BY over into that
		// subquery when it is either `alias.column` or a selected alias — a bare expression is parsed
		// as an alias name and the query fails ("CONCAT(members" alias was not found).
		q.addSelect("CONCAT(members.nickname,members.first_name,members.last_name)", "sort_nickname")
			.addSelect("CONCAT(members.last_name,members.first_name)", "sort_name")
			.addSelect("DATE_PART('year', AGE(CURRENT_DATE, members.birthday))", "sort_age")
			// Sort by the *displayed* group (its name, e.g. "6. oddíl"), not the internal group
			// id. `groups.name` carries the `natural_numeric` ICU collation (see Group entity),
			// so embedded numbers order naturally: "3. oddíl" precedes "22. oddíl", and
			// non-numeric names ("Klub přátel", …) sort after them.
			.addSelect("(SELECT g.name FROM groups g WHERE g.id = members.group_id)", "sort_group")
			// Membership is a list of payments, so it is sorted by the one value the list shows:
			// whether the fee for the year in question is paid.
			.addSelect(membershipPaid, "sort_membership");

		applySort(
			q,
			options,
			{
				nickname: "sort_nickname",
				name: "sort_name",
				role: "members.role",
				membership: "sort_membership",
				// The variable symbol is the year plus the member id (see helpers/variable-symbol.ts),
				// and every row of one list carries the same year — so ordering by the id orders by
				// the symbol, without building the string in SQL.
				variableSymbol: "members.id",
				age: "sort_age",
				birthday: "members.birthday",
				group: "sort_group",
				city: "members.addressCity",
				street: "members.addressStreet",
				status: "members.active",
			},
			{ column: "sort_nickname", order: "ASC" },
		);

		// Keep members within the same group in a readable order.
		if (options.sort === "group") {
			q.addOrderBy("sort_nickname", "ASC");
		}

		// The membership is part of every member the API hands out, so its payments are joined
		// unconditionally rather than fetched per member afterwards. TypeORM keeps pagination
		// correct with a distinct-id subquery despite the one-to-many join.
		q.leftJoinAndSelect("members.membership", "membership");

		// Join contacts up-front only when requested (i.e. the contacts column is visible).
		if (options.contacts) q.leftJoinAndSelect("members.contacts", "contacts");

		if (options.groups) q.andWhere("members.groupId IN (:...groupIds)", { groupIds: options.groups });

		if (options.search) {
			const search = toPrefixTsQuery(options.search);
			if (search) q.andWhere("members.searchVector @@ to_tsquery('simple_unaccent', :search)", { search });
		}

		if (options.roles) q.andWhere("members.role IN (:...roles)", { roles: options.roles });

		// The filter offers the two membership values; picking both is the same as no filter.
		if (options.membership?.length) {
			const paid = options.membership.includes(MembershipPaymentStates.zaplaceno);
			const unpaid = options.membership.includes(MembershipPaymentStates.nezaplaceno);
			if (paid !== unpaid) q.andWhere(`${membershipPaid} = :membershipPaid`, { membershipPaid: paid });
		}

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

	async getMember(
		id: number,
		options?: Omit<FindOneOptions<Member>, "relations"> & { relations?: FindOptionsRelations<Member> },
	) {
		return this.membersRepository.findOne({
			where: { id },
			...options,
			// The membership is part of every member the API hands out (see getMembers), so it is
			// always loaded — a caller's relations only add to it.
			relations: { membership: true, ...options?.relations },
		});
	}

	// Soft-deleted members only (deletedAt IS NOT NULL). withDeleted() lifts TypeORM's default
	// filter that hides them, and the explicit condition keeps the live members out.
	async getDeletedMembers(where: Brackets | string = "1=1") {
		return this.membersRepository
			.createQueryBuilder("members")
			.withDeleted()
			.leftJoinAndSelect("members.membership", "membership")
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

	/**
	 * Record the fee of one season. `upsert` on (member_id, for_year) rather than insert, so two
	 * treasurers clicking the same row cannot get past the unique index with an error — the second
	 * write simply overwrites the first with the same values.
	 */
	async createMembershipPayment(payment: Omit<MembershipPayment, "id" | "member">) {
		await this.membershipPaymentsRepository.upsert(payment, ["memberId", "forYear"]);

		return this.getMembershipPayment(payment.memberId, payment.forYear);
	}

	async getMembershipPayment(memberId: number, forYear: number) {
		return this.membershipPaymentsRepository.findOne({ where: { memberId, forYear } });
	}

	async getMembershipPayments(memberId: number) {
		return this.membershipPaymentsRepository.find({ where: { memberId }, order: { forYear: "DESC" } });
	}

	/** Un-record the fee of one season. Deleting a season that was never paid is a no-op. */
	async deleteMembershipPayment(memberId: number, forYear: number) {
		return this.membershipPaymentsRepository.delete({ memberId, forYear });
	}
}
