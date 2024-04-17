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
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { AcController, AcLinks, WithLinks } from "src/access-control/access-control-lib";
import { UserGuard } from "src/auth/guards/user.guard";
import { MembersRepository } from "src/models/members/repositories/members.repository";
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
  constructor(private members: MembersRepository) {}

  @Get()
  @AcLinks(MembersListRoute)
  @ApiOperation({ description: "Search members in the members database" })
  @ApiResponse({ type: WithLinks(MemberResponse), isArray: true })
  async listMembers(@Req() req: Request, @Query() query: MembersListQuery): Promise<MemberResponse[]> {
    return this.members.getMembers({
      ...query,
      limit: query.limit ?? 25,
    });
  }

  @Post()
  @AcLinks(MemberCreateRoute)
  @ApiResponse({ type: WithLinks(MemberResponse) })
  async createMember(@Req() req: Request, @Body() body: MemberCreateBody): Promise<MemberResponse> {
    MemberCreateRoute.canOrThrow(req, undefined);

    return this.members.createMember(body);
  }

  @Get(":id")
  @AcLinks(MemberReadRoute)
  @ApiResponse({ type: WithLinks(MemberResponse) })
  async getMember(@Param("id") id: number, @Req() req: Request): Promise<MemberResponse> {
    const member = await this.members.getMember(id, { relations: ["group", "contacts"] });
    if (!member) throw new NotFoundException();

    MemberReadRoute.canOrThrow(req, member);

    return member;
  }

  @Patch(":memberId")
  @AcLinks(MemberUpdateRoute)
  @ApiResponse({ status: 204 })
  async updateMember(@Req() req: Request, @Param("memberId") memberId: number, @Body() body: MemberUpdateBody) {
    const member = await this.members.getMember(memberId);
    if (!member) throw new NotFoundException();

    MemberUpdateRoute.canOrThrow(req, member);

    this.members.updateMember(memberId, body);
  }

  @Delete(":memberId")
  @AcLinks(MemberDeleteRoute)
  @ApiResponse({ status: 204 })
  async deleteMember(@Req() req: Request, @Param("memberId") memberId: number) {
    const member = await this.members.getMember(memberId);
    if (!member) throw new NotFoundException();

    MemberDeleteRoute.canOrThrow(req, member);

    this.members.deleteMember(memberId);
  }
}
