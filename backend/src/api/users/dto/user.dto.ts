import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { AcLink, AcLinksObject } from "src/access-control/access-control-lib/schema/ac-link";
import { MemberResponse } from "src/api/members/dto/member.dto";
import { Member } from "src/models/members/entities/member.entity";
import { User, UserRoles } from "src/models/users/entities/user.entity";
import { UsersController } from "../controllers/users.controller";

type LinkNames = ExtractExisting<
  keyof UsersController,
  "deleteUser" | "getUser" | "updateUser" | "impersonateUser" | "setUserPassword"
>;

export class UserResponseLinks implements AcLinksObject<LinkNames> {
  @ApiProperty() deleteUser!: AcLink;
  @ApiProperty() getUser!: AcLink;
  @ApiProperty() updateUser!: AcLink;
  @ApiProperty() impersonateUser!: AcLink;
  @ApiProperty() setUserPassword!: AcLink;
}

export class UserResponse implements User {
  @ApiProperty() id!: number;
  @ApiProperty() login!: string;

  @ApiPropertyOptional({ type: "number" }) memberId!: number | null;
  @ApiPropertyOptional({ type: "string" }) password!: string | null;
  @ApiPropertyOptional({ type: "string" }) email!: string | null;
  @ApiPropertyOptional({ type: "string" }) loginCode!: string | null;
  @ApiPropertyOptional({ type: "string" }) loginCodeExp!: Date | null;
  @ApiPropertyOptional({ enum: UserRoles, isArray: true }) roles!: UserRoles[] | null;

  @ApiPropertyOptional({ type: MemberResponse }) member?: Member | null;

  @ApiProperty({ type: UserResponseLinks }) _links!: UserResponseLinks;
}
