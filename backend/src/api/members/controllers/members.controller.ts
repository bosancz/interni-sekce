import { Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post, Req } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { InjectRepository } from "@nestjs/typeorm";
import { Request } from "express";
import { AcController } from "src/access-control/access-control-lib/decorators/ac-controller.decorator";
import { AcLinks } from "src/access-control/access-control-lib/decorators/ac-links.decorator";
import { Member } from "src/models/members/entities/member.entity";
import { MembersService } from "src/models/members/services/members.service";
import { Repository } from "typeorm";
import { MemberCreateRoute, MemberDeleteRoute, MemberRoute, MemberUpdateRoute, MembersRoute } from "../acl/members.acl";
import { CreateMemberBody, MemberResponse, UpdateMemberBody } from "../dto/member.dto";

@Controller("members")
@AcController()
@ApiTags("Members")
export class MembersController {
  constructor(
    private membersService: MembersService,
    @InjectRepository(Member) private membersRepository: Repository<Member>,
  ) {}

  @Get()
  @AcLinks(MembersRoute)
  @ApiResponse({ type: MemberResponse, isArray: true })
  async listMembers(@Req() req: Request) {
    return this.membersRepository.createQueryBuilder().where(MembersRoute.canWhere(req)).getMany();
  }

  @Post()
  @AcLinks(MemberCreateRoute)
  @ApiResponse({ type: MemberResponse })
  async createMember(@Req() req: Request, @Body() body: CreateMemberBody): Promise<MemberResponse> {
    MemberCreateRoute.canOrThrow(req, undefined);

    return this.membersService.createMember(body);
  }

  @Get(":id")
  @AcLinks(MemberRoute)
  @ApiResponse({ type: MemberResponse })
  async getMember(@Param("id") id: number, @Req() req: Request): Promise<MemberResponse> {
    const member = await this.membersService.getMember(id);
    if (!member) throw new NotFoundException();

    MemberRoute.canOrThrow(req, member);

    return member;
  }

  @Patch(":id")
  @AcLinks(MemberUpdateRoute)
  @ApiResponse({ status: 204 })
  async updateMember(@Req() req: Request, @Param("id") id: number, @Body() body: UpdateMemberBody) {
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
