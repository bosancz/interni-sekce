import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { EntityManager, Not, QueryFailedError, Repository } from "typeorm";
import { Group } from "../entities/group.entity";
import { GroupMembership } from "../entities/group-membership.entity";
import {
	ActiveGroupMembershipExistsError,
	GroupMembershipYearsError,
	GroupNotFoundError,
} from "../errors/group-membership.errors";

export type GroupMembershipData = Pick<GroupMembership, "groupId" | "yearFrom" | "yearTill" | "active">;

const ACTIVE_INDEX = "IDX_members_groups_active_member";

@Injectable()
export class GroupMembershipsRepository {
	constructor(@InjectRepository(GroupMembership) private groupMemberships: Repository<GroupMembership>) {}

	async getMemberships(memberId: number) {
		return this.groupMemberships.find({
			where: { memberId },
			order: {
				active: "DESC",
				yearTill: { direction: "DESC", nulls: "LAST" },
				yearFrom: { direction: "DESC", nulls: "LAST" },
				id: "DESC",
			},
		});
	}

	async getMembership(memberId: number, membershipId: number) {
		return this.groupMemberships.findOne({ where: { id: membershipId, memberId } });
	}

	async createMembership(memberId: number, data: GroupMembershipData, manager?: EntityManager) {
		const run = async (t: EntityManager) => {
			data = normalizeMembership(data);
			await this.assertValid(t, data);

			if (data.active) {
				await t
					.createQueryBuilder()
					.update(GroupMembership)
					.set({ active: false, yearTill: () => "GREATEST(year_from, EXTRACT(YEAR FROM CURRENT_DATE)::int)" })
					.where({ memberId, active: true })
					.execute();
			}

			return t.save(GroupMembership, t.create(GroupMembership, { ...data, memberId }));
		};

		return this.translateErrors(memberId, manager ? run(manager) : this.groupMemberships.manager.transaction(run));
	}

	async updateMembership(membership: GroupMembership, data: Partial<GroupMembershipData>) {
		const defined = Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined));
		const updated: GroupMembership = { ...membership, ...normalizeMembership({ ...membership, ...defined }) };

		return this.translateErrors(
			membership.memberId,
			this.groupMemberships.manager.transaction(async (t) => {
				await this.assertValid(t, updated);

				if (updated.active) {
					const otherActive = await t.exists(GroupMembership, {
						where: { memberId: membership.memberId, active: true, id: Not(membership.id) },
					});
					if (otherActive) throw new ActiveGroupMembershipExistsError(membership.memberId);
				}

				return t.save(GroupMembership, updated);
			}),
		);
	}

	async deleteMembership(memberId: number, membershipId: number) {
		await this.groupMemberships.delete({ id: membershipId, memberId });
	}

	private async assertValid(t: EntityManager, data: GroupMembershipData) {
		if (data.yearFrom !== null && data.yearTill !== null && data.yearTill < data.yearFrom)
			throw new GroupMembershipYearsError(data.yearFrom, data.yearTill);

		const groupExists = await t.exists(Group, { where: { id: data.groupId }, withDeleted: true });
		if (!groupExists) throw new GroupNotFoundError(data.groupId);
	}

	private async translateErrors<T>(memberId: number, promise: Promise<T>): Promise<T> {
		try {
			return await promise;
		} catch (err) {
			if (
				err instanceof QueryFailedError &&
				(err.driverError as { constraint?: string })?.constraint === ACTIVE_INDEX
			)
				throw new ActiveGroupMembershipExistsError(memberId);
			throw err;
		}
	}
}

function normalizeMembership<T extends GroupMembershipData>(data: T): T {
	return data.active ? { ...data, yearTill: null } : data;
}
