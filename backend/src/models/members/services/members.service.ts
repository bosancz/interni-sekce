import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { FindManyOptions, FindOneOptions, Repository } from "typeorm";
import { Member } from "../entities/member.entity";

@Injectable()
export class MembersService {
  constructor(@InjectRepository(Member) private membersRepository: Repository<Member>) {}

  async getMember(id: number, options?: FindOneOptions<Member>) {
    return this.membersRepository.findOne({ where: { id }, ...options });
  }

  async getMembers(options?: FindManyOptions<Member>) {
    return this.membersRepository.find(options);
  }
}
