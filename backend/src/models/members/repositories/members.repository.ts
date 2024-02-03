import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { PaginationOptions } from "src/models/helpers/pagination";
import { FindOneOptions, Repository } from "typeorm";
import { MemberContact } from "../entities/member-contact.entity";
import { Member } from "../entities/member.entity";

export interface GetMembersOptions extends PaginationOptions {
  group?: number;
  search?: string;
  roles?: string[];
  membership?: string;
}

@Injectable()
export class MembersRepository {
  constructor(
    @InjectRepository(Member) private membersRepository: Repository<Member>,
    @InjectRepository(MemberContact) private membersContactsRepository: Repository<MemberContact>,
  ) {}

  async getMembers(options: GetMembersOptions = {}) {
    const q = this.membersRepository
      .createQueryBuilder("members")
      .orderBy("CONCAT(members.nickname,members.first_name,members.last_name)", "ASC")
      .take(options.limit)
      .skip(options.offset);

    if (options.group) q.andWhere("members.groupId = :groupId", { groupId: options.group });

    if (options.search)
      q.andWhere(
        "members.nickname ILIKE :search OR members.firstName ILIKE :search OR members.lastName ILIKE :search",
        {
          search: `%${options.search}%`,
        },
      );

    if (options.roles) q.andWhere("members.role IN (:...roles)", { roles: options.roles });

    if (options.membership) q.andWhere("members.membership = :membership", { membership: options.membership });

    return q.getMany();
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

  async createContact(memberId: number, contactData: Partial<Omit<MemberContact, "id">>) {
    return this.membersContactsRepository.save({
      memberId,
      ...contactData,
    });
  }

  async deleteContact(memberId: number, contactId: number) {
    return this.membersContactsRepository.delete({ id: contactId, memberId });
  }
}
