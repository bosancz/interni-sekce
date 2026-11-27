import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {
	currentMembershipYear,
	MembershipPaymentStates,
	membershipPaidExpression,
	membershipPaidOnExpression,
} from "src/helpers/membership";
import { PaginationOptions } from "src/helpers/pagination";
import { toPrefixTsQuery } from "src/helpers/search";
import { applySort } from "src/helpers/sort";
import { Brackets, FindOneOptions, FindOptionsRelations, In, Not, Repository } from "typeorm";
import { MemberAchievement, MemberAchievementTypes } from "../entities/member-achievements.entity";
import { MemberContact } from "../entities/member-contact.entity";
import { MemberTraining } from "../entities/member-training.entity";
import { sortMemberContacts } from "../helpers/member-contacts";
import { Member } from "../entities/member.entity";
import { MembershipPayment } from "../entities/membership-payment.entity";
import { MemberRoles } from "../schema/member-roles";
import { GroupMembershipsRepository } from "./group-memberships.repository";
import { memberActiveSql, memberGroupIdSql, memberInGroupsSql } from "../helpers/group-memberships";

export interface GetMembersOptions extends PaginationOptions {
	groups?: number[];
	search?: string;
	roles?: string[];
	// "zaplaceno" / "nezaplaceno" (see helpers/membership.ts), asked about membershipYear
	membership?: string[];
	// Which year the membership filter and sort look at; defaults to the current one.
	membershipYear?: number;
	age?: number[];
	achievements?: MemberAchievementTypes[];
	active?: boolean;
	noGroup?: boolean;
	// Keep the members who paid the fee of membershipYear even where `active` would drop them.
	includeMembershipPaid?: boolean;
	contacts?: boolean;
	badges?: boolean;
	// Join the member's group, for the readers that need its name rather than its id.
	withGroup?: boolean;
}

@Injectable()
export class MembersRepository {
	constructor(
		@InjectRepository(Member) private membersRepository: Repository<Member>,
		@InjectRepository(MemberContact) private membersContactsRepository: Repository<MemberContact>,
		@InjectRepository(MemberAchievement) private memberAchievements: Repository<MemberAchievement>,
		@InjectRepository(MemberTraining) private memberTrainings: Repository<MemberTraining>,
		@InjectRepository(MembershipPayment) private membershipPaymentsRepository: Repository<MembershipPayment>,
		private groupMemberships: GroupMembershipsRepository,
	) {}

	async getBirthdayMembers(roles: MemberRoles[], month: number, days: number[]) {
		return this.membersRepository
			.createQueryBuilder("members")
			.select(["members.id", "members.nickname", "members.firstName", "members.lastName", "members.birthday"])
			.where(memberActiveSql("members"))
			.andWhere("members.role IN (:...roles)", { roles })
			.andWhere("EXTRACT(MONTH FROM members.birthday) = :month", { month })
			.andWhere("EXTRACT(DAY FROM members.birthday) IN (:...days)", { days })
			.orderBy("members.birthday", "DESC")
			.addOrderBy("members.nickname", "ASC")
			.getMany();
	}

	async getMembers(options: GetMembersOptions = {}, where: Brackets | string = "1=1") {
		// Everything membership-related on this list — the filter, the sort — is asked about one
		// year, so the treasurer view can look back at previous seasons.
		const membershipYear = options.membershipYear ?? currentMembershipYear();
		const membershipPaid = membershipPaidExpression("members.id", membershipYear);
		const membershipPaidOn = membershipPaidOnExpression("members.id", membershipYear);

		const q = this.membersRepository
			.createQueryBuilder("members")
			.where(where)
			.take(options.limit)
			.skip(options.offset);

		q.addSelect("CONCAT(members.nickname,members.first_name,members.last_name)", "sort_nickname")
			.addSelect("CONCAT(members.first_name,members.last_name)", "sort_first_name")
			.addSelect("CONCAT(members.last_name,members.first_name)", "sort_last_name")
			.addSelect("DATE_PART('year', AGE(CURRENT_DATE, members.birthday))", "sort_age")
			// Sort by the *displayed* group (its name, e.g. "6. oddíl"), not the internal group
			// id. `groups.name` carries the `natural_numeric` ICU collation (see Group entity),
			// so embedded numbers order naturally: "3. oddíl" precedes "22. oddíl", and
			// non-numeric names ("Klub přátel", …) sort after them.
			.addSelect(`(SELECT g.name FROM groups g WHERE g.id = ${memberGroupIdSql("members")})`, "sort_group")
			.addSelect(memberActiveSql("members"), "sort_status")
			// Membership is a list of payments, so it is sorted by the one value the list shows:
			// whether the fee for the year in question is paid.
			.addSelect(membershipPaid, "sort_membership")
			.addSelect(membershipPaidOn, "sort_paid_on");

		applySort(
			q,
			options,
			{
				nickname: "sort_nickname",
				firstName: "sort_first_name",
				lastName: "sort_last_name",
				name: "sort_last_name",
				role: "members.role",
				membership: "sort_membership",
				paidOn: { column: "sort_paid_on", nulls: "NULLS LAST" },
				// The variable symbol is the year plus the member id (see helpers/variable-symbol.ts),
				// and every row of one list carries the same year — so ordering by the id orders by
				// the symbol, without building the string in SQL.
				variableSymbol: "members.id",
				age: "sort_age",
				birthday: "members.birthday",
				group: "sort_group",
				city: "members.addressCity",
				street: "members.addressStreet",
				status: "sort_status",
			},
			{ column: "sort_nickname", order: "ASC" },
		);

		if (options.sort && options.sort !== "nickname") {
			q.addOrderBy("sort_nickname", "ASC");
		}

		// The membership is part of every member the API hands out, so its payments are joined
		// unconditionally rather than fetched per member afterwards. TypeORM keeps pagination
		// correct with a distinct-id subquery despite the one-to-many join.
		q.leftJoinAndSelect("members.membership", "membership");

		// Join contacts up-front only when requested (i.e. the contacts column is visible).
		if (options.contacts) q.leftJoinAndSelect("members.contacts", "contacts");

		// Same for the group: the lists resolve it from their own copy of the groups, only the
		// exports need the name on the member itself.
		q.leftJoinAndSelect("members.groupMemberships", "groupMemberships");
		if (options.withGroup) q.leftJoinAndSelect("groupMemberships.group", "group");

		if (options.noGroup)
			q.andWhere("NOT EXISTS (SELECT 1 FROM members_groups mg_none WHERE mg_none.member_id = members.id)");

		if (options.groups?.length) {
			q.setParameter("groupIds", options.groups);
			if (options.active === true) q.andWhere(memberInGroupsSql("members", "groupIds", true));
			else q.andWhere(memberInGroupsSql("members", "groupIds", false));
			if (options.active === false) q.andWhere(`NOT ${memberInGroupsSql("members", "groupIds", true)}`);
		}

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

		if (options.achievements?.length)
			q.andWhere(
				"EXISTS (SELECT 1 FROM members_achievements ma WHERE ma.member_id = members.id AND ma.type IN (:...achievements))",
				{ achievements: options.achievements },
			);

		// The treasurer view hides inactive members like every other list, with one exception: the
		// ones who paid the season's fee stay. Their money is in the totals above the table, so the
		// row it came from cannot be missing from the table itself — it is shown dimmed, as inactive
		// members are everywhere.
		if (options.active !== undefined && !options.groups?.length) {
			const activeCondition = options.active ? memberActiveSql("members") : `NOT ${memberActiveSql("members")}`;
			if (options.includeMembershipPaid)
				q.andWhere(new Brackets((qb) => qb.where(activeCondition).orWhere(membershipPaid)));
			else q.andWhere(activeCondition);
		}

		const members = await q.getMany();

		for (const member of members) {
			if (member.contacts) member.contacts = sortMemberContacts(member.contacts);
		}

		if (options.badges && members.length) await this.loadBadges(members);

		return members;
	}

	/**
	 * The membership summary of one season over every member the caller may see: how many have the
	 * fee recorded and what those fees add up to.
	 *
	 * It deliberately ignores what the list above it is filtered or searched by. The figures are the
	 * club's takings for the season, so they must not move as someone narrows the table to one group
	 * — and a paginated list could not be summed by its reader anyway.
	 */
	async getMembershipSummary(
		year: number = currentMembershipYear(),
		where: Brackets | string = "1=1",
	): Promise<{ year: number; paidCount: number; totalAmount: number }> {
		const membershipPaid = membershipPaidExpression("members.id", year);

		// The join can never multiply a member's row — a member has at most one payment per season
		// (see the unique index on MembershipPayment) — so the fees are summed over the members
		// themselves. Whether a fee counts as paid is asked the one way it is asked everywhere:
		// through membershipPaidExpression, the SQL side of isMembershipPaid.
		const row = await this.membersRepository
			.createQueryBuilder("members")
			.where(where)
			.leftJoin(
				MembershipPayment,
				"summary_payment",
				"summary_payment.member_id = members.id AND summary_payment.for_year = :summaryYear",
				{ summaryYear: year },
			)
			.select(`COUNT(*) FILTER (WHERE ${membershipPaid})`, "paid_count")
			.addSelect("COALESCE(SUM(summary_payment.amount), 0)", "total_amount")
			.getRawOne<{ paid_count: string; total_amount: string }>();

		return {
			year,
			paidCount: Number(row?.paid_count ?? 0),
			totalAmount: Number(row?.total_amount ?? 0),
		};
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

	async getMember(
		id: number,
		options?: Omit<FindOneOptions<Member>, "relations"> & { relations?: FindOptionsRelations<Member> },
	) {
		return this.membersRepository.findOne({
			where: { id },
			...options,
			// The membership is part of every member the API hands out (see getMembers), so it is
			// always loaded — a caller's relations only add to it.
			relations: { membership: true, groupMemberships: true, ...options?.relations },
		});
	}

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

	async getDeletedMember(id: number) {
		return this.membersRepository.findOne({ where: { id }, withDeleted: true });
	}

	async restoreMember(id: number) {
		return this.membersRepository.restore({ id });
	}

	async hardDeleteMember(id: number) {
		return this.membersRepository.delete({ id });
	}

	async createMember(
		memberData: Partial<Omit<Member, "id" | "groupId" | "active">>,
		groupId?: number | null,
		groupActive = true,
	) {
		return this.membersRepository.manager.transaction(async (t) => {
			const member = await t.save(Member, t.create(Member, memberData));
			if (groupId)
				await this.groupMemberships.createMembership(
					member.id,
					groupActive
						? { groupId, yearFrom: new Date().getFullYear(), yearTill: null, active: true }
						: { groupId, yearFrom: null, yearTill: null, active: false },
					t,
				);
			return t.findOneOrFail(Member, { where: { id: member.id }, relations: { groupMemberships: true } });
		});
	}

	async updateMember(id: number, memberData: Partial<Omit<Member, "id" | "groupId" | "active">>) {
		return this.membersRepository.update(id, memberData);
	}

	async deleteMember(id: number) {
		return this.membersRepository.softDelete({ id });
	}

	private async loadBadges(members: Member[]) {
		const memberIds = members.map((member) => member.id);
		const [achievements, trainings] = await Promise.all([
			this.memberAchievements.find({ where: { memberId: In(memberIds) } }),
			this.memberTrainings.find({ where: { memberId: In(memberIds) } }),
		]);

		for (const member of members) {
			member.achievements = achievements.filter((achievement) => achievement.memberId === member.id);
			member.trainings = trainings.filter((training) => training.memberId === member.id);
		}
	}

	async getContacts(memberId: number) {
		const contacts = await this.membersContactsRepository.find({ where: { memberId } });
		return sortMemberContacts(contacts);
	}

	async createContact(memberId: number, contactData: Partial<Omit<MemberContact, "id">>) {
		const contact = await this.membersContactsRepository.save({ ...contactData, memberId });
		if (contact.isDefault) await this.clearOtherDefaultContacts(memberId, contact.id);
		return contact;
	}

	async getContact(memberId: number, contactId: number) {
		return this.membersContactsRepository.findOne({ where: { id: contactId, memberId } });
	}

	async updateContact(memberId: number, contactId: number, contactData: Partial<Omit<MemberContact, "id">>) {
		const contact = await this.membersContactsRepository.save({ ...contactData, id: contactId, memberId });
		if (contact.isDefault) await this.clearOtherDefaultContacts(memberId, contactId);
		return contact;
	}

	async deleteContact(memberId: number, contactId: number) {
		return this.membersContactsRepository.delete({ id: contactId, memberId });
	}

	private async clearOtherDefaultContacts(memberId: number, contactId: number) {
		await this.membersContactsRepository.update(
			{ memberId, id: Not(contactId), isDefault: true },
			{ isDefault: false },
		);
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
