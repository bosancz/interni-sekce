import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { FindManyOptions, FindOneOptions, Repository } from "typeorm";
import { Member } from "../entities/member.entity";

@Injectable()
export class MembersService {
  constructor(@InjectRepository(Member) private membersRepository: Repository<Member>) {}

  async getMembers(options?: FindManyOptions<Member>) {
    return this.membersRepository.find(options);
  }

  async getMember(id: number, options?: FindOneOptions<Member>) {
    return this.membersRepository.findOne({ where: { id }, ...options });
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
}
