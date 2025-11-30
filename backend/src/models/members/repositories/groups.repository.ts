import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ListGroupsQuery } from "src/api/members/dto/group.dto";
import { FindOneOptions, Repository } from "typeorm";
import { Group } from "../entities/group.entity";

@Injectable()
export class GroupsRepository {
	constructor(@InjectRepository(Group) private groupsRepository: Repository<Group>) {}

	async getGroups(options: ListGroupsQuery = {}) {
		const q = this.groupsRepository.createQueryBuilder("groups");

		q.addOrderBy("short_name", "ASC", "NULLS LAST");

		if (options.active) q.where({ active: options.active });
		if (options.includeMemberCounts) {
			q.loadRelationCountAndMap("groups.memberCount", "groups.members", "members", (qb) =>
				qb.andWhere("members.deletedAt IS NULL"),
			);
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
