import { ApiProperty } from "@nestjs/swagger";
import { IsObject } from "class-validator";
import { UserSettings } from "src/models/users/entities/user.entity";

export class AccountSettingsResponse {
	@ApiProperty({ type: "object", additionalProperties: true })
	settings!: UserSettings;
}

export class AccountSettingsBody {
	@ApiProperty({ type: "object", additionalProperties: true })
	@IsObject()
	settings!: UserSettings;
}
