import { IsNumber, IsOptional } from "class-validator";
import { JwtPayload } from "jsonwebtoken";
import { UserRoles } from "src/models/users/entities/user.entity";

/**
 * JWT payload. Carries only the user identity — roles and the linked member are
 * loaded fresh from the database on every request, so the token never holds
 * authorization data that could go stale.
 */
export class TokenPayload {
	@IsNumber()
	userId!: number;

	/**
	 * Set while impersonating: the user who started the impersonation. Logging out
	 * of an impersonated session returns to this identity instead of ending the session.
	 */
	@IsOptional()
	@IsNumber()
	impersonatorId?: number;
}

export type SignedToken = TokenPayload & JwtPayload;

/**
 * Per-request session context attached to `req.user`. Resolved from the database
 * on every request, so it always reflects the current DB state.
 */
export interface SessionUser {
	userId: number;
	memberId?: number;
	/** Group of the linked member, if any — used to scope leader (`vedouci`) permissions to their own group. */
	memberGroupId?: number;
	memberActive: boolean;
	roles: UserRoles[];
	/** The user this session is impersonating from, if any. */
	impersonatorId?: number;
}
