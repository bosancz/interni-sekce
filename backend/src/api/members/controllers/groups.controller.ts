import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { AcController, AcLinks, WithLinks } from "src/access-control/access-control-lib";
import { UserGuard } from "src/auth/guards/user.guard";
import { GroupsRepository } from "src/models/members/repositories/groups.repository";
import { GroupCreateRoute, GroupDeleteRoute, GroupEditRoute, GroupListRoute, GroupReadRoute } from "../acl/groups.acl";
import { CreateGroupBody, GroupResponse, ListGroupsQuery, UpdateGroupBody } from "../dto/group.dto";

@Controller("groups")
@UseGuards(UserGuard)
@AcController()
@ApiTags("Members")
export class GroupsController {
  constructor(private groups: GroupsRepository) {}

  @Get()
  @AcLinks(GroupListRoute)
  @ApiResponse({ type: WithLinks(GroupResponse), isArray: true })
  async listGroups(@Req() req: Request, @Query() query: ListGroupsQuery): Promise<GroupResponse[]> {
    return this.groups.getGroups(query);
  }

  @Post()
  @AcLinks(GroupCreateRoute)
  @ApiResponse({ status: HttpStatus.CREATED, type: WithLinks(GroupResponse) })
  async createGroup(@Req() req: Request, @Body() groupData: CreateGroupBody) {
    GroupCreateRoute.canOrThrow(req, undefined);
    return this.groups.createGroup(groupData);
  }

  @Get(":id")
  @AcLinks(GroupReadRoute)
  @ApiResponse({ type: WithLinks(GroupResponse) })
  async getGroup(@Param("id") id: number, @Req() req: Request) {
    const group = await this.groups.getGroup(id);
    if (!group) throw new NotFoundException();

    GroupReadRoute.canOrThrow(req, group);

    return group;
  }

  @Put(":id")
  @AcLinks(GroupEditRoute)
  @ApiResponse({ status: HttpStatus.OK })
  async updateGroup(@Param("id") id: number, @Req() req: Request, @Body() body: UpdateGroupBody) {
    const group = await this.groups.getGroup(id);
    if (!group) throw new NotFoundException();

    GroupEditRoute.canOrThrow(req, group);

    await this.groups.updateGroup(id, req.body);
  }

  @Delete(":id")
  @AcLinks(GroupDeleteRoute)
  async deleteGroup(@Param("id") id: number, @Req() req: Request): Promise<void> {
    const group = await this.groups.getGroup(id);
    if (!group) throw new NotFoundException();

    GroupDeleteRoute.canOrThrow(req, group);

    await this.groups.deleteGroup(id);
  }
}
