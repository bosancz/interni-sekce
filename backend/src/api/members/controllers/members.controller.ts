import { Controller, Get } from "@nestjs/common";
import { AcController } from "src/models/access-control/decorators/ac-controller.decorator";
import { AcEntity } from "src/models/access-control/decorators/ac-entity.decorator";

@Controller("members")
@AcController()
export class MembersController {
  @Get(":id")
  @AcEntity("member", { path: (doc) => `members/${doc.id}` })
  async getEventAttendee(): Promise<any> {
    return {};
  }
}
