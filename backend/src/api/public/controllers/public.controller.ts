import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

@Controller("public")
@ApiTags("Public")
export class PublicController {
  @Get()
  getProgram() {}

  @Get()
  getGallery() {}
}
