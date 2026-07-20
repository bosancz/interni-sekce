import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ListGroupsQuery } from "src/api/members/dto/group.dto";
import { Brackets, FindOneOptions, Repository, SelectQueryBuilder } from "typeorm";
import { Group } from "../entities/group.entity";
import { Member } from "../entities/member.entity";

@Injectable()
export class GroupsRepository {
	constructor(@InjectRepository(Group) private groupsRepository: Repository<Group>) {}

	async getGroups(options: ListGroupsQuery = {}, where: Brackets | string = "1=1") {
		const q = this.groupsRepository.createQueryBuilder("groups");

		// row-level permission filter (see Permission.canWhere)
		q.where(where);

		q.addOrderBy("short_name", "ASC", "NULLS LAST");

		if (options.active) q.andWhere({ active: options.active });

		if (options.includeMemberCounts) {
			q.addSelect(
				(qb: SelectQueryBuilder<Group>) =>
					qb
						.subQuery()
						.select("COUNT(*)")
						.from(Member, "members")
						.where("members.groupId = groups.id")
						.andWhere("members.deletedAt IS NULL"),
				"groups_memberCount",
			);

			const { entities, raw } = await q.getRawAndEntities();
			return entities.map((entity, i) => Object.assign(entity, { memberCount: Number(raw[i]?.groups_memberCount ?? 0) }));
		}

		return q.getMany();
	}

	async getGroup(id: number, options?: FindOneOptions<Group>) {
		return this.groupsRepository.findOne({ where: { id }, ...options });
	}

	async createGroup(groupData: Pick<Group, "shortName" | "name">) {
		return this.groupsRepository.save({ ...groupData, active: true });
	}

	async updateGroup(id: number, groupData: Partial<Group>) {
		await this.groupsRepository.update({ id }, groupData);
	}

	async deleteGroup(id: number) {
		await this.groupsRepository.softDelete({ id });
	}
}
