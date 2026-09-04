import {
	Body,
	Controller,
	Delete,
	Get,
	NotFoundException,
	Param,
	ParseIntPipe,
	Patch,
	Post,
	Req,
} from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { AcController, AcLinks, WithLinks } from "src/access-control/access-control-lib";
import { Authenticated } from "src/auth/decorators/authenticated.decorator";
import { MembersRepository } from "src/models/members/repositories/members.repository";
import {
	MemberContactsCreatePermission,
	MemberContactsDeletePermission,
	MemberContactsListPermission,
} from "../acl/member-contacts.acl";
import { CreateContactBody, MemberContactResponse, UpdateContactBody } from "../dto/member-contact.dto";

function toContactData(body: CreateContactBody) {
	return {
		...body,
		mobile: body.mobile ?? [],
		email: body.email ?? [],
		isDefault: body.isDefault ?? false,
	};
}

@Controller("members/:memberId/contacts")
@Authenticated()
@AcController()
@ApiTags("Members")
export class MemberContactsController {
	constructor(private membersRepository: MembersRepository) {}

	@Get()
	@AcLinks(MemberContactsListPermission)
	@ApiResponse({ status: 200, type: WithLinks(MemberContactResponse), isArray: true })
	async listContacts(
		@Req() req: Request,
		@Param("memberId", ParseIntPipe) memberId: number,
	): Promise<MemberContactResponse[]> {
		const member = await this.membersRepository.getMember(memberId);
		if (!member) throw new NotFoundException();

		MemberContactsListPermission.canOrThrow(req, member);

		return this.membersRepository.getContacts(member.id);
	}

	@Post()
	@AcLinks(MemberContactsCreatePermission)
	@ApiResponse({ type: WithLinks(MemberContactResponse) })
	async createContact(
		@Req() req: Request,
		@Param("memberId", ParseIntPipe) memberId: number,
		@Body() body: CreateContactBody,
	): Promise<MemberContactResponse> {
		const member = await this.membersRepository.getMember(memberId);
		if (!member) throw new NotFoundException();

		MemberContactsCreatePermission.canOrThrow(req, member);

		return this.membersRepository.createContact(member.id, toContactData(body));
	}

	@Patch(":contactId")
	@AcLinks(MemberContactsCreatePermission)
	@ApiResponse({ type: WithLinks(MemberContactResponse) })
	async updateContact(
		@Req() req: Request,
		@Param("memberId", ParseIntPipe) memberId: number,
		@Param("contactId", ParseIntPipe) contactId: number,
		@Body() body: UpdateContactBody,
	): Promise<MemberContactResponse> {
		const member = await this.membersRepository.getMember(memberId);
		if (!member) throw new NotFoundException();

		MemberContactsCreatePermission.canOrThrow(req, member);

		return this.membersRepository.updateContact(member.id, contactId, toContactData(body));
	}

	@Delete(":contactId")
	@AcLinks(MemberContactsDeletePermission)
	@ApiResponse({ type: WithLinks(MemberContactResponse) })
	async deleteContact(
		@Req() req: Request,
		@Param("memberId", ParseIntPipe) memberId: number,
		@Param("contactId", ParseIntPipe) contactId: number,
	) {
		const memberContact = await this.membersRepository.getContact(memberId, contactId);
		if (!memberContact) throw new NotFoundException();

		MemberContactsDeletePermission.canOrThrow(req, memberContact);

		return this.membersRepository.deleteContact(memberId, contactId);
	}
}
