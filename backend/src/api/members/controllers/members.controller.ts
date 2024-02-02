import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { InjectRepository } from "@nestjs/typeorm";
import { Request } from "express";
import { AcController, AcLinks, WithLinks } from "src/access-control/access-control-lib";
import { UserGuard } from "src/auth/guards/user.guard";
import { Member } from "src/models/members/entities/member.entity";
import { MembersService } from "src/models/members/services/members.service";
import { Repository } from "typeorm";
import {
  MemberCreateRoute,
  MemberDeleteRoute,
  MemberReadRoute,
  MemberUpdateRoute,
  MembersListRoute,
} from "../acl/members.acl";
import { MemberCreateBody, MemberResponse, MemberUpdateBody, MembersListQuery } from "../dto/member.dto";

@Controller("members")
@UseGuards(UserGuard)
@AcController()
@ApiTags("Members")
export class MembersController {
  constructor(
    private membersService: MembersService,
    @InjectRepository(Member) private membersRepository: Repository<Member>,
  ) {}

  @Get()
  @AcLinks(MembersListRoute)
  @ApiResponse({ type: WithLinks(MemberResponse), isArray: true })
  async listMembers(@Req() req: Request, @Query() query: MembersListQuery): Promise<MemberResponse[]> {
    const q = this.membersRepository
      .createQueryBuilder("members")
      .where(MembersListRoute.canWhere(req))
      .orderBy("CONCAT(members.nickname,members.first_name,members.last_name)", "ASC")
      .take(query.limit || 25)
      .skip(query.offset || 0);

    if (query.group) q.andWhere("members.groupId = :groupId", { groupId: query.group });

    if (query.search)
      q.andWhere(
        "members.nickname ILIKE :search OR members.firstName ILIKE :search OR members.lastName ILIKE :search",
        {
          search: `%${query.search}%`,
        },
      );

    if (query.roles) q.andWhere("members.role IN (:...roles)", { roles: query.roles });

    if (query.membership) q.andWhere("members.membership = :membership", { membership: query.membership });

    return q.getMany();
  }

  @Post()
  @AcLinks(MemberCreateRoute)
  @ApiResponse({ type: WithLinks(MemberResponse) })
  async createMember(@Req() req: Request, @Body() body: MemberCreateBody): Promise<MemberResponse> {
    console.log(body);
    MemberCreateRoute.canOrThrow(req, undefined);

    return this.membersService.createMember(body);
  }

  @Get(":id")
  @AcLinks(MemberReadRoute)
  @ApiResponse({ type: WithLinks(MemberResponse) })
  async getMember(@Param("id") id: number, @Req() req: Request): Promise<MemberResponse> {
    const member = await this.membersService.getMember(id);
    if (!member) throw new NotFoundException();

    MemberReadRoute.canOrThrow(req, member);

    return member;
  }

  @Patch(":id")
  @AcLinks(MemberUpdateRoute)
  @ApiResponse({ status: 204 })
  async updateMember(@Req() req: Request, @Param("id") id: number, @Body() body: MemberUpdateBody) {
    const member = await this.membersService.getMember(id);
    if (!member) throw new NotFoundException();

    MemberUpdateRoute.canOrThrow(req, member);

    this.membersService.updateMember(id, body);
  }

  @Delete(":id")
  @AcLinks(MemberDeleteRoute)
  @ApiResponse({ status: 204 })
  async deleteMember(@Req() req: Request, @Param("id") id: number) {
    const member = await this.membersService.getMember(id);
    if (!member) throw new NotFoundException();

    MemberDeleteRoute.canOrThrow(req, member);

    this.membersService.deleteMember(id);
  }
}
