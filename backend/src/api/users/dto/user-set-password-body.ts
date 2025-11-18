import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class UserSetPasswordBody {
	@ApiProperty() @IsString() password!: string;
}
