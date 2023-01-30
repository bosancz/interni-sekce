import { Controller, Delete, Get, NotFoundException, Param, Put, Req } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { InjectRepository } from "@nestjs/typeorm";
import { Request } from "express";
import { AcController } from "src/access-control/access-control-lib/decorators/ac-controller.decorator";
import { AcLinks } from "src/access-control/access-control-lib/decorators/ac-links.decorator";
import { Group } from "src/models/members/entities/group.entity";
import { GroupsService } from "src/models/members/services/groups.service";
import { Repository } from "typeorm";
import { GroupDeleteRoute, GroupEditRoute, GroupListRoute, GroupReadRoute } from "../acl/groups.acl";
import { GroupResponse } from "../dto/group.dto";

@Controller("groups")
@AcController()
@ApiTags("Members")
export class GroupsController {
  constructor(
    private groupsService: GroupsService,
    @InjectRepository(Group) private groupsRepository: Repository<Group>,
  ) {}

  @Get()
  @AcLinks(GroupListRoute)
  @ApiResponse({ type: GroupResponse, isArray: true })
  async groupsList(@Req() req: Request) {
    return this.groupsRepository.createQueryBuilder().where(GroupListRoute.canWhere(req)).getMany();
  }

  @Get(":id")
  @AcLinks(GroupReadRoute)
  @ApiResponse({ type: GroupResponse })
  async groupRead(@Param("id") id: string, @Req() req: Request) {
    const group = await this.groupsService.getGroup(id);
    if (!group) throw new NotFoundException();

    GroupReadRoute.canOrThrow(req, group);

    return group;
  }

  @Put(":id")
  @AcLinks(GroupEditRoute)
  async groupEdit(@Param("id") id: string, @Req() req: Request) {
    const group = await this.groupsService.getGroup(id);
    if (!group) throw new NotFoundException();

    GroupEditRoute.canOrThrow(req, group);

    // TODO:
  }

  @Delete(":id")
  @AcLinks(GroupDeleteRoute)
  async groupDelete(@Param("id") id: string, @Req() req: Request) {
    const group = await this.groupsService.getGroup(id);
    if (!group) throw new NotFoundException();

    GroupDeleteRoute.canOrThrow(req, group);

    // TODO:
  }
}
