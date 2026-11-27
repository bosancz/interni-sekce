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
import { GroupMembershipsRepository } from "src/models/members/repositories/group-memberships.repository";
import { MembersRepository } from "src/models/members/repositories/members.repository";
import {
	GroupMembershipCreatePermission,
	GroupMembershipDeletePermission,
	GroupMembershipsListPermission,
	GroupMembershipUpdatePermission,
} from "../acl/group-memberships.acl";
import {
	GroupMembershipCreateBody,
	GroupMembershipResponse,
	GroupMembershipUpdateBody,
} from "../dto/group-membership.dto";
import { rethrowGroupMembershipErrors } from "../helpers/group-membership-errors";

@Controller("members/:memberId/group-memberships")
@Authenticated()
@AcController()
@ApiTags("Members")
export class GroupMembershipsController {
	constructor(
		private membersRepository: MembersRepository,
		private groupMemberships: GroupMembershipsRepository,
	) {}

	@Get()
	@AcLinks(GroupMembershipsListPermission)
	@ApiResponse({ status: 200, type: WithLinks(GroupMembershipResponse), isArray: true })
	async listGroupMemberships(
		@Req() req: Request,
		@Param("memberId", ParseIntPipe) memberId: number,
	): Promise<GroupMembershipResponse[]> {
		const member = await this.membersRepository.getMember(memberId);
		if (!member) throw new NotFoundException();

		GroupMembershipsListPermission.canOrThrow(req, member);

		return this.groupMemberships.getMemberships(member.id);
	}

	@Post()
	@AcLinks(GroupMembershipCreatePermission)
	@ApiResponse({ type: WithLinks(GroupMembershipResponse) })
	async createGroupMembership(
		@Req() req: Request,
		@Param("memberId", ParseIntPipe) memberId: number,
		@Body() body: GroupMembershipCreateBody,
	): Promise<GroupMembershipResponse> {
		const member = await this.membersRepository.getMember(memberId);
		if (!member) throw new NotFoundException();

		GroupMembershipCreatePermission.canOrThrow(req, member);

		return this.groupMemberships
			.createMembership(member.id, {
				groupId: body.groupId,
				yearFrom: body.yearFrom ?? null,
				yearTill: body.yearTill ?? null,
				active: body.active ?? (body.yearTill === undefined || body.yearTill === null),
			})
			.catch(rethrowGroupMembershipErrors);
	}

	@Patch(":membershipId")
	@AcLinks(GroupMembershipUpdatePermission)
	@ApiResponse({ type: WithLinks(GroupMembershipResponse) })
	async updateGroupMembership(
		@Req() req: Request,
		@Param("memberId", ParseIntPipe) memberId: number,
		@Param("membershipId", ParseIntPipe) membershipId: number,
		@Body() body: GroupMembershipUpdateBody,
	): Promise<GroupMembershipResponse> {
		const membership = await this.groupMemberships.getMembership(memberId, membershipId);
		if (!membership) throw new NotFoundException();

		GroupMembershipUpdatePermission.canOrThrow(req, membership);

		return this.groupMemberships
			.updateMembership(membership, {
				groupId: body.groupId,
				yearFrom: body.yearFrom,
				yearTill: body.yearTill,
				active: body.active,
			})
			.catch(rethrowGroupMembershipErrors);
	}

	@Delete(":membershipId")
	@AcLinks(GroupMembershipDeletePermission)
	async deleteGroupMembership(
		@Req() req: Request,
		@Param("memberId", ParseIntPipe) memberId: number,
		@Param("membershipId", ParseIntPipe) membershipId: number,
	): Promise<void> {
		const membership = await this.groupMemberships.getMembership(memberId, membershipId);
		if (!membership) throw new NotFoundException();

		GroupMembershipDeletePermission.canOrThrow(req, membership);

		await this.groupMemberships.deleteMembership(memberId, membershipId);
	}
}
