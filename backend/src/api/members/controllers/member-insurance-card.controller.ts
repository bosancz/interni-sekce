import { Controller, Get, HttpStatus, NotFoundException, Param, Put, Req, Res, UseGuards } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { Request, Response } from "express";
import { createReadStream } from "fs";
import { AcController, AcLinks } from "src/access-control/access-control-lib";
import { UserGuard } from "src/auth/guards/user.guard";
import { Config } from "src/config";
import { MembersService } from "src/models/members/services/members.service";
import {
  MemberInsuranceCardDeleteRoute,
  MemberInsuranceCardReadRoute,
  MemberInsuranceCardUploadRoute,
} from "../acl/member-insurance-card.acl";

@Controller("members/:id/insurance-card")
@UseGuards(UserGuard)
@AcController()
@ApiTags("Members")
export class MemberInsuranceCardController {
  constructor(private membersService: MembersService) {}

  @Get("")
  @AcLinks(MemberInsuranceCardReadRoute)
  @ApiResponse({})
  async getInsuranceCard(@Req() req: Request, @Res() res: Response, @Param("id") memberId: number) {
    const member = await this.membersService.getMember(memberId);
    if (!member) throw new NotFoundException("Member not found");

    MemberInsuranceCardReadRoute.canOrThrow(req, member);

    const cardFile = createReadStream(`${Config.fs.membersDir}/${member.id}/${member.insuranceCardFile}`);

    cardFile.pipe(res);
  }

  @Put("")
  @AcLinks(MemberInsuranceCardUploadRoute)
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  async uploadInsuranceCard(@Req() req: Request, @Param("id") memberId: number) {
    const member = await this.membersService.getMember(memberId);
    if (!member) throw new NotFoundException("Member not found");

    MemberInsuranceCardUploadRoute.canOrThrow(req, member);

    //TODO: card upload
  }

  @Put("")
  @AcLinks(MemberInsuranceCardDeleteRoute)
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  async deleteInsuranceCard(@Req() req: Request, @Param("id") memberId: number) {
    const member = await this.membersService.getMember(memberId);
    if (!member) throw new NotFoundException("Member not found");

    MemberInsuranceCardDeleteRoute.canOrThrow(req, member);

    //TODO: card delete
  }
}
