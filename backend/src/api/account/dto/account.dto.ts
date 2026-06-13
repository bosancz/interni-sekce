import { ApiPropertyOptional } from "@nestjs/swagger";
import { AcEntity, WithLinks } from "src/access-control/access-control-lib";
import { MemberResponse } from "src/api/members/dto/member.dto";
import { GetUserQueryDto } from "src/api/users/dto/user.dto";
import { Member } from "src/models/members/entities/member.entity";
import { User } from "src/models/users/entities/user.entity";

export class AccountResponse extends User {
	@AcEntity(MemberResponse)
	@ApiPropertyOptional({ type: WithLinks(MemberResponse) })
	member!: Member;
}
export class GetMeQueryDto extends GetUserQueryDto {}
