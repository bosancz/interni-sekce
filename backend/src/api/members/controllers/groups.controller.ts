import {
	Body,
	ConflictException,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
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
import { QueryFailedError } from "typeorm";
import { AcController, AcLinks, WithLinks } from "src/access-control/access-control-lib";
import { Authenticated } from "src/auth/decorators/authenticated.decorator";
import { GroupsRepository } from "src/models/members/repositories/groups.repository";
import {
	GroupCreatePermission,
	GroupDeletePermission,
	GroupEditPermission,
	GroupListPermission,
	GroupPermanentDeletePermission,
	GroupReadPermission,
	GroupRestorePermission,
} from "../acl/groups.acl";
import { CreateGroupBody, GroupResponse, ListGroupsQuery, UpdateGroupBody } from "../dto/group.dto";

@Controller("groups")
@Authenticated()
@AcController()
@ApiTags("Members")
export class GroupsController {
	constructor(private groups: GroupsRepository) {}

	@Get()
	@AcLinks(GroupListPermission)
	@ApiResponse({ status: 200, type: WithLinks(GroupResponse), isArray: true })
	async listGroups(@Req() req: Request, @Query() query: ListGroupsQuery): Promise<GroupResponse[]> {
		const where = GroupListPermission.canWhere(req, "groups");

		return this.groups.getGroups(query, where);
	}

	@Post()
	@AcLinks(GroupCreatePermission)
	@ApiResponse({ status: HttpStatus.CREATED, type: WithLinks(GroupResponse) })
	async createGroup(@Req() req: Request, @Body() groupData: CreateGroupBody) {
		GroupCreatePermission.canOrThrow(req);
		return this.groups.createGroup(groupData);
	}

	@Get(":groupId")
	@AcLinks(GroupReadPermission)
	@ApiResponse({ status: 200, type: WithLinks(GroupResponse) })
	async getGroup(@Param("groupId", ParseIntPipe) groupId: number, @Req() req: Request) {
		const group = await this.groups.getGroup(groupId);
		if (!group) throw new NotFoundException();

		GroupReadPermission.canOrThrow(req, group);

		return group;
	}

	@Patch(":groupId")
	@AcLinks(GroupEditPermission)
	@ApiResponse({ status: HttpStatus.OK })
	async updateGroup(@Param("groupId", ParseIntPipe) groupId: number, @Req() req: Request, @Body() body: UpdateGroupBody) {
		const group = await this.groups.getGroup(groupId);
		if (!group) throw new NotFoundException();

		GroupEditPermission.canOrThrow(req, group);

		await this.groups.updateGroup(groupId, body);
	}

	@Delete(":groupId")
	@AcLinks(GroupDeletePermission)
	async deleteGroup(@Param("groupId", ParseIntPipe) groupId: number, @Req() req: Request): Promise<void> {
		const group = await this.groups.getGroup(groupId);
		if (!group) throw new NotFoundException();

		GroupDeletePermission.canOrThrow(req, group);

		await this.groups.deleteGroup(groupId);
	}

	@Post(":groupId/restore")
	@HttpCode(HttpStatus.NO_CONTENT)
	@AcLinks(GroupRestorePermission)
	@ApiResponse({ status: HttpStatus.NO_CONTENT })
	async restoreGroup(@Param("groupId", ParseIntPipe) groupId: number, @Req() req: Request): Promise<void> {
		const group = await this.groups.getGroup(groupId, { withDeleted: true });
		if (!group) throw new NotFoundException();

		GroupRestorePermission.canOrThrow(req, group);

		await this.groups.restoreGroup(groupId);
	}

	@Delete(":groupId/permanent")
	@AcLinks(GroupPermanentDeletePermission)
	async permanentlyDeleteGroup(@Param("groupId", ParseIntPipe) groupId: number, @Req() req: Request): Promise<void> {
		const group = await this.groups.getGroup(groupId, { withDeleted: true });
		if (!group) throw new NotFoundException();

		GroupPermanentDeletePermission.canOrThrow(req, group);

		try {
			await this.groups.hardDeleteGroup(groupId);
		} catch (err) {
			// Postgres foreign-key violation (23503): the members→groups FK (onDelete RESTRICT)
			// still references this group, so it can't be permanently removed
			if (err instanceof QueryFailedError && (err.driverError as { code?: string }).code === "23503") {
				throw new ConflictException("Oddíl nelze trvale smazat, protože jsou na něj navázané záznamy (např. členové).");
			}
			throw err;
		}
	}
}
