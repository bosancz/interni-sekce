import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { FindManyOptions, FindOneOptions, Repository } from "typeorm";
import { Group } from "../entities/group.entity";

@Injectable()
export class GroupsService {
  constructor(@InjectRepository(Group) private groupsRepository: Repository<Group>) {}

  getGroups(options?: FindManyOptions) {
    return this.groupsRepository.find(options);
  }

  getGroup(id: string, options?: FindOneOptions<Group>) {
    return this.groupsRepository.findOne({ where: { id }, ...options });
  }
}
