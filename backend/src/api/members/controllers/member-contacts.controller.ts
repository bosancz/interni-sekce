import { Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { AcController, AcLinks, WithLinks } from "src/access-control/access-control-lib";
import { UserGuard } from "src/auth/guards/user.guard";
import { MembersRepository } from "src/models/members/repositories/members.repository";
import {
	MemberContactsCreatePermission,
	MemberContactsDeletePermission,
	MemberContactsListPermission,
} from "../acl/member-contacts.acl";
import { CreateContactBody, MemberContactResponse } from "../dto/member-contact.dto";

@Controller("members/:id/contacts")
@UseGuards(UserGuard)
@AcController()
@ApiTags("Members")
export class MemberContactsController {
	constructor(private membersRepository: MembersRepository) {}

	@Get()
	@AcLinks(MemberContactsListPermission)
	@ApiResponse({ status: 200, type: WithLinks(MemberContactResponse), isArray: true })
	async listContacts(@Req() req: Request, @Param("id") memberId: number): Promise<MemberContactResponse[]> {
		const member = await this.membersRepository.getMember(memberId, { relations: ["contacts"] });
		if (!member) throw new NotFoundException();

		MemberContactsListPermission.canOrThrow(req, member);

		return member.contacts!;
	}

	@Post()
	@AcLinks(MemberContactsCreatePermission)
	@ApiResponse({ type: WithLinks(MemberContactResponse) })
	async createContact(
		@Req() req: Request,
		@Param("id") memberId: number,
		@Body() body: CreateContactBody,
	): Promise<MemberContactResponse> {
		const member = await this.membersRepository.getMember(memberId);
		if (!member) throw new NotFoundException();

		MemberContactsCreatePermission.canOrThrow(req, member);

		return this.membersRepository.createContact(member.id, body);
	}

	@Patch(":contactId")
	@AcLinks(MemberContactsCreatePermission)
	@ApiResponse({ type: WithLinks(MemberContactResponse) })
	async updateContact(
		@Req() req: Request,
		@Param("id") memberId: number,
		@Param("contactId") contactId: number,
		@Body() body: CreateContactBody,
	): Promise<MemberContactResponse> {
		const member = await this.membersRepository.getMember(memberId);
		if (!member) throw new NotFoundException();

		MemberContactsCreatePermission.canOrThrow(req, member);

		return this.membersRepository.updateContact(member.id, contactId, body);
	}

	@Delete(":contactId")
	@AcLinks(MemberContactsDeletePermission)
	@ApiResponse({ type: WithLinks(MemberContactResponse) })
	async deleteContact(@Req() req: Request, @Param("id") memberId: number, @Param("contactId") contactId: number) {
		const memberContact = await this.membersRepository.getContact(memberId, contactId);
		if (!memberContact) throw new NotFoundException();

		MemberContactsDeletePermission.canOrThrow(req, memberContact);

		return this.membersRepository.deleteContact(memberId, contactId);
	}
}
