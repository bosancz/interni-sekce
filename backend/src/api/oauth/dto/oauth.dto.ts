import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

/**
 * Body of the OAuth2 token endpoint (application/x-www-form-urlencoded).
 * Client credentials may arrive here or via HTTP Basic auth, hence optional.
 */
export class OauthTokenBody {
	@ApiProperty() @IsString() grant_type!: string;
	@ApiProperty() @IsString() code!: string;
	@ApiProperty({ required: false }) @IsOptional() @IsString() redirect_uri?: string;
	@ApiProperty({ required: false }) @IsOptional() @IsString() client_id?: string;
	@ApiProperty({ required: false }) @IsOptional() @IsString() client_secret?: string;
}
