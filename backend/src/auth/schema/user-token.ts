import { IsNumber, IsOptional } from "class-validator";
import { JwtPayload } from "jsonwebtoken";
import { UserRoles } from "src/models/users/schema/user-roles";

export class TokenPayload {
	@IsNumber()
	userId!: number;

	@IsOptional()
	@IsNumber()
	impersonatorId?: number;
}

export type SignedToken = TokenPayload & JwtPayload;

export interface SessionUser {
	userId: number;
	memberId?: number;
	memberGroupId?: number;
	roles: UserRoles[];
	impersonatorId?: number;
}
