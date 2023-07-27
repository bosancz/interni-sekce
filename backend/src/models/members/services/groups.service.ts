import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { FindManyOptions, FindOneOptions, Repository } from "typeorm";
import { Group } from "../entities/group.entity";

@Injectable()
export class GroupsService {
  constructor(@InjectRepository(Group) private groupsRepository: Repository<Group>) {}

  async getGroups(options?: FindManyOptions) {
    return this.groupsRepository.find(options);
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
