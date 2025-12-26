import { GetUserQueryDto } from "src/api/users/dto/user.dto";
import { Member } from "src/models/members/entities/member.entity";
import { User } from "src/models/users/entities/user.entity";

export class AccountResponse extends User {
	member!: Member;
}
export class GetMeQueryDto extends GetUserQueryDto {}
