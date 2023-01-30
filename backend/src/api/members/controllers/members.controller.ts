import { Controller, Get, NotFoundException, Param, Req } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { InjectRepository } from "@nestjs/typeorm";
import { Request } from "express";
import { AcController } from "src/access-control/access-control-lib/decorators/ac-controller.decorator";
import { AcLinks } from "src/access-control/access-control-lib/decorators/ac-links.decorator";
import { Member } from "src/models/members/entities/member.entity";
import { MembersService } from "src/models/members/services/members.service";
import { Repository } from "typeorm";
import { MemberRoute, MembersRoute } from "../acl/members.acl";
import { MemberResponse } from "../dto/member.dto";

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
  async membersList(@Req() req: Request) {
    return this.membersRepository.createQueryBuilder().where(MembersRoute.canWhere(req)).getMany();
  }

  @Get(":id")
  @AcLinks(MemberRoute)
  @ApiResponse({ type: MemberResponse })
  async memberRead(@Param("id") id: number, @Req() req: Request): Promise<MemberResponse> {
    const member = await this.membersService.getMember(id);
    if (!member) throw new NotFoundException();

    MemberRoute.canOrThrow(req, member);

    return member;
  }
}
