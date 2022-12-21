import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AcController } from "src/access-control/decorators/ac-controller.decorator";
import { AcLinks } from "src/access-control/decorators/ac-links.decorator";
import { MemberACL, MembersACL } from "../acl/members.acl";

@Controller("members")
@AcController()
@ApiTags("Members")
export class MembersController {
  @Get()
  @AcLinks(MembersACL, { contains: { array: { entity: MemberACL } } })
  async listMembers(): Promise<any> {
    return [];
  }

  @Get(":id")
  @AcLinks(MemberACL, { path: (m) => `${m.id}` })
  async getMember(): Promise<any> {
    return {};
  }
}
