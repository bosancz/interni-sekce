import { Controller, Delete, Get, NotFoundException, Param, Put, Req } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { InjectRepository } from "@nestjs/typeorm";
import { Request } from "express";
import { AcController } from "src/access-control/access-control-lib/decorators/ac-controller.decorator";
import { AcLinks } from "src/access-control/access-control-lib/decorators/ac-links.decorator";
import { AccessControlService } from "src/access-control/access-control-lib/services/access-control.service";
import { canWhere } from "src/access-control/util/can-where";
import { Group } from "src/models/members/entities/group.entity";
import { GroupsService } from "src/models/members/services/groups.service";
import { Repository } from "typeorm";
import { GroupDeleteACL, GroupEditACL, GroupListACL, GroupReadACL } from "../acl/groups.acl";
import { GroupResponse } from "../dto/group.dto";

@Controller("groups")
@AcController()
@ApiTags("Members")
export class GroupsController {
  constructor(
    private ac: AccessControlService,
    private groupsService: GroupsService,
    @InjectRepository(Group) private groupsRepository: Repository<Group>,
  ) {}

  @Get()
  @AcLinks(GroupListACL, { contains: { array: { entity: GroupReadACL } } })
  @ApiResponse({ type: GroupResponse, isArray: true })
  async groupsList(@Req() req: Request) {
    return this.groupsRepository.createQueryBuilder().where(canWhere(this.ac, GroupListACL, req)).getMany();
  }

  @Get(":id")
  @AcLinks(GroupReadACL)
  @ApiResponse({ type: GroupResponse })
  async groupRead(@Param("id") id: string, @Req() req: Request) {
    const group = await this.groupsService.getGroup(id);
    if (!group) throw new NotFoundException();

    this.ac.canOrThrow(GroupReadACL, group, req);

    return group;
  }

  @Put(":id")
  @AcLinks(GroupEditACL)
  async groupEdit(@Param("id") id: string, @Req() req: Request) {
    const group = await this.groupsService.getGroup(id);
    if (!group) throw new NotFoundException();

    this.ac.canOrThrow(GroupEditACL, group, req);

    // TODO:
  }

  @Delete(":id")
  @AcLinks(GroupDeleteACL)
  async groupDelete(@Param("id") id: string, @Req() req: Request) {
    const group = await this.groupsService.getGroup(id);
    if (!group) throw new NotFoundException();

    this.ac.canOrThrow(GroupDeleteACL, group, req);

    // TODO:
  }
}
