import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsString } from "class-validator";

export class LoginCredentialsBody {
  @ApiProperty() @IsString() login!: string;
  @ApiProperty() @IsString() password!: string;
}

export class LoginGoogleBody {
  @ApiProperty() @IsString() token!: string;
}

export class LoginLinkQuery {
  @ApiProperty() @IsString() code!: string;
}

export class LoginSendLinkBody {
  @ApiProperty() @IsString() login!: string;
}

export class LoginImpersonateBody {
  @ApiProperty() @IsNumber() userId!: number;
}
