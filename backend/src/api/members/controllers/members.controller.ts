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
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { AcController, AcLinks, WithLinks } from "src/access-control/access-control-lib";
import { UserGuard } from "src/auth/guards/user.guard";
import { MembersRepository } from "src/models/members/repositories/members.repository";
import {
	MemberCreatePermission,
	MemberDeletePermission,
	MemberReadPermission,
	MemberUpdatePermission,
	MembersListPermission,
} from "../acl/members.acl";
import { MemberCreateBody, MemberResponse, MemberUpdateBody, MembersListQuery } from "../dto/member.dto";

@Controller("members")
@UseGuards(UserGuard)
@AcController()
@ApiTags("Members")
export class MembersController {
	constructor(private members: MembersRepository) {}

	@Get()
	@AcLinks(MembersListPermission)
	@ApiResponse({ status: 200, type: WithLinks(MemberResponse), isArray: true })
	async listMembers(@Req() req: Request, @Query() query: MembersListQuery): Promise<MemberResponse[]> {
		return this.members.getMembers({
			...query,
			limit: query.limit ?? 25,
		});
	}

	@Post()
	@AcLinks(MemberCreatePermission)
	@ApiResponse({ status: 200, type: WithLinks(MemberResponse) })
	async createMember(@Req() req: Request, @Body() body: MemberCreateBody): Promise<MemberResponse> {
		MemberCreatePermission.canOrThrow(req);

		return this.members.createMember(body);
	}

	@Get(":id")
	@AcLinks(MemberReadPermission)
	@ApiResponse({ status: 200, type: WithLinks(MemberResponse) })
	async getMember(@Param("id") id: number, @Req() req: Request): Promise<MemberResponse> {
		const member = await this.members.getMember(id);
		if (!member) throw new NotFoundException();

		MemberReadPermission.canOrThrow(req, member);

		return member;
	}

	@Patch(":id")
	@AcLinks(MemberUpdatePermission)
	@ApiResponse({ status: 204 })
	async updateMember(@Req() req: Request, @Param("id") id: number, @Body() body: MemberUpdateBody) {
		const member = await this.members.getMember(id);
		if (!member) throw new NotFoundException();

		MemberUpdatePermission.canOrThrow(req, member);

		this.members.updateMember(id, body);
	}

	@Delete(":id")
	@AcLinks(MemberDeletePermission)
	@ApiResponse({ status: 204 })
	async deleteMember(@Req() req: Request, @Param("id") id: number) {
		const member = await this.members.getMember(id);
		if (!member) throw new NotFoundException();

		MemberDeletePermission.canOrThrow(req, member);

		this.members.deleteMember(id);
	}
}
