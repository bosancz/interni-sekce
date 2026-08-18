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
	Query,
	Req,
} from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { AcController, AcLinks, WithLinks } from "src/access-control/access-control-lib";
import { Authenticated } from "src/auth/decorators/authenticated.decorator";
import { MembersRepository } from "src/models/members/repositories/members.repository";
import {
	MemberCreatePermission,
	MemberDeletePermanentPermission,
	MemberDeletePermission,
	MemberReadPermission,
	MemberRestorePermission,
	MembersDeletedListPermission,
	MembersListPermission,
	MemberUpdatePermission,
} from "../acl/members.acl";
import { MemberCreateBody, MemberResponse, MemberUpdateBody, MembersListQuery } from "../dto/member.dto";

@Controller("members")
@Authenticated()
@AcController()
@ApiTags("Members")
export class MembersController {
	constructor(private members: MembersRepository) {}

	@Get()
	@AcLinks(MembersListPermission)
	@ApiResponse({ status: 200, type: WithLinks(MemberResponse), isArray: true })
	async listMembers(@Req() req: Request, @Query() query: MembersListQuery): Promise<MemberResponse[]> {
		const where = MembersListPermission.canWhere(req, "members");

		const members = await this.members.getMembers(
			{
				...query,
				limit: query.limit ?? 25,
			},
			where,
		);

		return members;
	}

	@Get("ages")
	@ApiResponse({ status: 200, type: Number, isArray: true })
	async listMemberAges(@Req() req: Request): Promise<number[]> {
		const where = MembersListPermission.canWhere(req, "members");

		return this.members.getMemberAges(where);
	}

	@Get("deleted")
	@AcLinks(MembersDeletedListPermission)
	@ApiResponse({ status: 200, type: WithLinks(MemberResponse), isArray: true })
	async listDeletedMembers(@Req() req: Request): Promise<MemberResponse[]> {
		MembersDeletedListPermission.canOrThrow(req);

		const where = MembersDeletedListPermission.canWhere(req, "members");

		return this.members.getDeletedMembers(where);
	}

	@Post()
	@AcLinks(MemberCreatePermission)
	@ApiResponse({ status: 200, type: WithLinks(MemberResponse) })
	async createMember(@Req() req: Request, @Body() body: MemberCreateBody): Promise<MemberResponse> {
		MemberCreatePermission.canOrThrow(req);

		return await this.members.createMember(body);
	}

	@Get(":memberId")
	@AcLinks(MemberReadPermission)
	@ApiResponse({ status: 200, type: WithLinks(MemberResponse) })
	async getMember(@Param("memberId", ParseIntPipe) memberId: number, @Req() req: Request): Promise<MemberResponse> {
		const member = await this.members.getMember(memberId);
		if (!member) throw new NotFoundException();

		MemberReadPermission.canOrThrow(req, member);

		return member;
	}

	@Patch(":memberId")
	@AcLinks(MemberUpdatePermission)
	@ApiResponse({ status: 204 })
	async updateMember(@Req() req: Request, @Param("memberId", ParseIntPipe) memberId: number, @Body() body: MemberUpdateBody) {
		const member = await this.members.getMember(memberId);
		if (!member) throw new NotFoundException();

		MemberUpdatePermission.canOrThrow(req, member);

		await this.members.updateMember(memberId, body);
	}

	@Delete(":memberId")
	@AcLinks(MemberDeletePermission)
	@ApiResponse({ status: 204 })
	async deleteMember(@Req() req: Request, @Param("memberId", ParseIntPipe) memberId: number) {
		const member = await this.members.getMember(memberId);
		if (!member) throw new NotFoundException();

		MemberDeletePermission.canOrThrow(req, member);

		await this.members.deleteMember(memberId);
	}

	@Post(":memberId/restore")
	@AcLinks(MemberRestorePermission)
	@ApiResponse({ status: 204 })
	async restoreMember(@Req() req: Request, @Param("memberId", ParseIntPipe) memberId: number) {
		const member = await this.members.getDeletedMember(memberId);
		if (!member) throw new NotFoundException();

		MemberRestorePermission.canOrThrow(req, member);

		await this.members.restoreMember(memberId);
	}

	@Delete(":memberId/permanent")
	@AcLinks(MemberDeletePermanentPermission)
	@ApiResponse({ status: 204 })
	async deleteMemberPermanent(@Req() req: Request, @Param("memberId", ParseIntPipe) memberId: number) {
		const member = await this.members.getDeletedMember(memberId);
		if (!member) throw new NotFoundException();

		MemberDeletePermanentPermission.canOrThrow(req, member);

		await this.members.hardDeleteMember(memberId);
	}
}
