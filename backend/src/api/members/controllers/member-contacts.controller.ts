import { Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
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

@Controller("members/:memberId/contacts")
@UseGuards(UserGuard)
@AcController()
@ApiTags("Members")
export class MemberContactsController {
  constructor(private membersRepository: MembersRepository) {}

  @Get()
  @AcLinks(MemberContactsListRoute)
  @ApiResponse({ type: WithLinks(MemberContactResponse), isArray: true })
  @ApiOperation({ description: "List parent contacts for a specific member" })
  async listContacts(@Req() req: Request, @Param("memberId") memberId: number): Promise<MemberContactResponse[]> {
    const member = await this.membersRepository.getMember(memberId, { relations: ["contacts"] });
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
    const member = await this.membersRepository.getMember(memberId);
    if (!member) throw new NotFoundException();

    MemberContactsCreateRoute.canOrThrow(req, member);

    return this.membersRepository.createContact(member.id, body);
  }

  @Patch(":contactId")
  @AcLinks(MemberContactsCreateRoute)
  @ApiResponse({ type: WithLinks(MemberContactResponse) })
  async updateContact(
    @Req() req: Request,
    @Param("id") memberId: number,
    @Param("contactId") contactId: number,
    @Body() body: CreateContactBody,
  ): Promise<MemberContactResponse> {
    const member = await this.membersRepository.getMember(memberId);
    if (!member) throw new NotFoundException();

    MemberContactsCreateRoute.canOrThrow(req, member);

    return this.membersRepository.updateContact(member.id, contactId, body);
  }

  @Delete(":contactId")
  @AcLinks(MemberContactsDeleteRoute)
  @ApiResponse({ type: WithLinks(MemberContactResponse) })
  async deleteContact(@Req() req: Request, @Param("id") memberId: number, @Param("contactId") contactId: number) {
    const member = await this.membersRepository.getMember(memberId);
    if (!member) throw new NotFoundException();

    MemberContactsDeleteRoute.canOrThrow(req, member);

    return this.membersRepository.deleteContact(member.id, contactId);
  }
}
