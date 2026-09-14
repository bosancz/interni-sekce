import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class OauthTokenBody {
	@ApiProperty() @IsString() grant_type!: string;
	@ApiProperty() @IsString() code!: string;
	@ApiProperty({ required: false }) @IsOptional() @IsString() redirect_uri?: string;
	@ApiProperty({ required: false }) @IsOptional() @IsString() client_id?: string;
	@ApiProperty({ required: false }) @IsOptional() @IsString() client_secret?: string;
}
