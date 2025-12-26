import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { AcEntity, WithLinks } from "src/access-control/access-control-lib";
import { MemberResponse } from "src/api/members/dto/member.dto";
import { Member } from "src/models/members/entities/member.entity";
import { User, UserRoles } from "src/models/users/entities/user.entity";

export class UserResponse implements User {
	@ApiProperty() id!: number;
	@ApiProperty() login!: string;

	@ApiPropertyOptional({ type: "number" }) memberId!: number | null;
	@ApiPropertyOptional({ type: "string" }) password!: string | null;
	@ApiPropertyOptional({ type: "string" }) email!: string | null;
	@ApiPropertyOptional({ type: "string" }) loginCode!: string | null;
	@ApiPropertyOptional({ type: "string" }) loginCodeExp!: string | null;
	@ApiPropertyOptional({ enum: UserRoles, enumName: "UserRolesEnum", isArray: true }) roles!: UserRoles[] | null;

	@AcEntity(MemberResponse)
	@ApiPropertyOptional({ type: WithLinks(MemberResponse) })
	member?: Member | null;
}

export class GetUserQueryDto {
	includeMember?: boolean;
}
