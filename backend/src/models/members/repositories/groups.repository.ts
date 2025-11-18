import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { FindOneOptions, Repository } from "typeorm";
import { Group } from "../entities/group.entity";

export interface GetGroupsOptions {
	active?: boolean;
}

@Injectable()
export class GroupsRepository {
	constructor(@InjectRepository(Group) private groupsRepository: Repository<Group>) {}

	async getGroups(options: GetGroupsOptions = {}) {
		return this.groupsRepository.find({
			order: { shortName: "ASC" },
			where: { active: options.active },
		});
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
