import { Body, Controller, Delete, Get, NotFoundException, Param, Post, Req, UseGuards } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { AcController, AcLinks, WithLinks } from "src/access-control/access-control-lib";
import { UserGuard } from "src/auth/guards/user.guard";
import { MembersRepository } from "src/models/members/repositories/members.repository";
import {
  MemberContactsCreateRoute,
  MemberContactsDeleteRoute,
  MemberContactsListRoute,
} from "../acl/member-contacts.acl";
import { CreateContactBody, MemberContactResponse } from "../dto/member-contact.dto";

@Controller("members/:id/contacts")
@UseGuards(UserGuard)
@AcController()
@ApiTags("Members")
export class MemberContactsController {
  constructor(private membersService: MembersRepository) {}

  @Get()
  @AcLinks(MemberContactsListRoute)
  @ApiResponse({ type: WithLinks(MemberContactResponse), isArray: true })
  async listContacts(@Req() req: Request, @Param("id") memberId: number): Promise<MemberContactResponse[]> {
    const member = await this.membersService.getMember(memberId, { relations: ["contacts"] });
    if (!member) throw new NotFoundException();

    MemberContactsListRoute.canOrThrow(req, member);

    return member.contacts!;
  }

  @Post()
  @AcLinks(MemberContactsCreateRoute)
  @ApiResponse({ type: WithLinks(MemberContactResponse) })
  async createContact(
    @Req() req: Request,
    @Param("id") memberId: number,
    @Body() body: CreateContactBody,
  ): Promise<MemberContactResponse> {
    const member = await this.membersService.getMember(memberId);
    if (!member) throw new NotFoundException();

    MemberContactsCreateRoute.canOrThrow(req, member);

    return this.membersService.createContact(member.id, body);
  }

  @Delete(":contactId")
  @AcLinks(MemberContactsDeleteRoute)
  @ApiResponse({ type: WithLinks(MemberContactResponse) })
  async deleteContact(@Req() req: Request, @Param("id") memberId: number, @Param("contactId") contactId: number) {
    const member = await this.membersService.getMember(memberId);
    if (!member) throw new NotFoundException();

    MemberContactsDeleteRoute.canOrThrow(req, member);

    return this.membersService.deleteContact(member.id, contactId);
  }
}
