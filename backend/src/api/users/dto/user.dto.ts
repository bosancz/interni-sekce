import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { AcLink } from "src/access-control/access-control-lib/schema/ac-link";
import { AcLinkProperties } from "src/access-control/access-control-lib/schema/ac-link-properties";
import { AcResponse } from "src/access-control/access-control-lib/schema/ac-response";
import { MemberResponse } from "src/api/members/dto/member.dto";
import { Member } from "src/models/members/entities/member.entity";
import { User, UserRoles } from "src/models/users/entities/user.entity";
import { UsersController } from "../controllers/users.controller";

type LinkNames = ExtractExisting<
  keyof UsersController,
  "deleteUser" | "getUser" | "updateUser" | "impersonateUser" | "setUserPassword"
>;

export class UserResponseLinks implements AcLinkProperties<LinkNames> {
  @ApiProperty() deleteUser!: AcLink;
  @ApiProperty() getUser!: AcLink;
  @ApiProperty() updateUser!: AcLink;
  @ApiProperty() impersonateUser!: AcLink;
  @ApiProperty() setUserPassword!: AcLink;
}

export class UserResponse implements AcResponse<User, LinkNames> {
  @ApiProperty() id!: number;
  @ApiProperty() login!: string;

  @ApiPropertyOptional({ type: "number" }) memberId!: number | null;
  @ApiPropertyOptional({ type: "string" }) password!: string | null;
  @ApiPropertyOptional({ type: "string" }) email!: string | null;
  @ApiPropertyOptional({ type: "string" }) loginCode!: string | null;
  @ApiPropertyOptional({ type: "Date" }) loginCodeExp!: Date | null;
  @ApiPropertyOptional({ enum: UserRoles, isArray: true }) roles!: UserRoles[] | null;

  @ApiPropertyOptional({ type: MemberResponse }) member?: Member | null;

  @ApiProperty({ type: UserResponseLinks }) _links!: UserResponseLinks;
}
