import { Controller } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

@Controller("public")
@ApiTags("Public")
export class PublicController {}
