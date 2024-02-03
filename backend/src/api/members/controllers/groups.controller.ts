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
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { InjectRepository } from "@nestjs/typeorm";
import { Request } from "express";
import { AcController, AcLinks, WithLinks } from "src/access-control/access-control-lib";
import { UserGuard } from "src/auth/guards/user.guard";
import { Group } from "src/models/members/entities/group.entity";
import { GroupsRepository } from "src/models/members/repositories/groups.repository";
import { Repository } from "typeorm";
import { GroupCreateRoute, GroupDeleteRoute, GroupEditRoute, GroupListRoute, GroupReadRoute } from "../acl/groups.acl";
import { CreateGroupBody, GroupResponse, UpdateGroupBody } from "../dto/group.dto";

@Controller("groups")
@UseGuards(UserGuard)
@AcController()
@ApiTags("Members")
export class GroupsController {
  constructor(
    private groupsService: GroupsRepository,
    @InjectRepository(Group) private groupsRepository: Repository<Group>,
  ) {}

  @Get()
  @AcLinks(GroupListRoute)
  @ApiResponse({ type: WithLinks(GroupResponse), isArray: true })
  async listGroups(@Req() req: Request) {
    return this.groupsRepository.createQueryBuilder().where(GroupListRoute.canWhere(req)).getMany();
  }

  @Post()
  @AcLinks(GroupCreateRoute)
  @ApiResponse({ status: HttpStatus.CREATED, type: WithLinks(GroupResponse) })
  async createGroup(@Req() req: Request, @Body() groupData: CreateGroupBody) {
    GroupCreateRoute.canOrThrow(req, undefined);
    return this.groupsService.createGroup(groupData);
  }

  @Get(":id")
  @AcLinks(GroupReadRoute)
  @ApiResponse({ type: WithLinks(GroupResponse) })
  async getGroup(@Param("id") id: number, @Req() req: Request) {
    const group = await this.groupsService.getGroup(id);
    if (!group) throw new NotFoundException();

    GroupReadRoute.canOrThrow(req, group);

    return group;
  }

  @Put(":id")
  @AcLinks(GroupEditRoute)
  @ApiResponse({ status: HttpStatus.OK })
  async updateGroup(@Param("id") id: number, @Req() req: Request, @Body() body: UpdateGroupBody) {
    const group = await this.groupsService.getGroup(id);
    if (!group) throw new NotFoundException();

    GroupEditRoute.canOrThrow(req, group);

    await this.groupsService.updateGroup(id, req.body);
  }

  @Delete(":id")
  @AcLinks(GroupDeleteRoute)
  async deleteGroup(@Param("id") id: number, @Req() req: Request): Promise<void> {
    const group = await this.groupsService.getGroup(id);
    if (!group) throw new NotFoundException();

    GroupDeleteRoute.canOrThrow(req, group);

    await this.groupsService.deleteGroup(id);
  }
}
