import { Controller, Get, NotFoundException, Param, Req } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { InjectRepository } from "@nestjs/typeorm";
import { Request } from "express";
import { AcController } from "src/access-control/access-control-lib/decorators/ac-controller.decorator";
import { AcLinks } from "src/access-control/access-control-lib/decorators/ac-links.decorator";
import { AccessControlService } from "src/access-control/access-control-lib/services/access-control.service";
import { canWhere } from "src/access-control/util/can-where";
import { Member } from "src/models/members/entities/member.entity";
import { MembersService } from "src/models/members/services/members.service";
import { Repository } from "typeorm";
import { MemberACL, MembersACL } from "../acl/members.acl";
import { MemberResponse } from "../dto/member.dto";

@Controller("members")
@AcController()
@ApiTags("Members")
export class MembersController {
  constructor(
    private membersService: MembersService,
    private ac: AccessControlService,
    @InjectRepository(Member) private membersRepository: Repository<Member>,
  ) {}

  @Get()
  @AcLinks(MembersACL, { contains: { array: { entity: MemberACL } } })
  @ApiResponse({ type: MemberResponse, isArray: true })
  async membersList(@Req() req: Request) {
    return this.membersRepository.createQueryBuilder().where(canWhere(this.ac, MembersACL, req)).getMany();
  }

  @Get(":id")
  @AcLinks(MemberACL)
  @ApiResponse({ type: MemberResponse })
  async memberRead(@Param("id") id: number, @Req() req: Request): Promise<MemberResponse> {
    const member = await this.membersService.getMember(id);
    if (!member) throw new NotFoundException();

    this.ac.canOrThrow(MemberACL, member, req);

    return member;
  }
}
