import { Injectable } from "@nestjs/common";
import { JwtService, JwtSignOptions } from "@nestjs/jwt";
import { Request, Response } from "express";
import { JwtPayload } from "jsonwebtoken";
import { UsersRepository } from "src/models/users/repositories/users.repository";
import { SignedToken, TokenPayload } from "../schema/user-token";

@Injectable()
export class TokenService {
	private readonly cookieName = "token";

	/** How long a session survives without any visit; every visit extends it again (see renewTokenIfNeeded) */
	private readonly tokenLifetimeDays = 90;

	/** Tokens older than this get re-issued, so the cookie is not rewritten on every request */
	private readonly tokenRenewalAgeSeconds = 24 * 60 * 60;

	constructor(
		private jwtService: JwtService,
		private usersRepository: UsersRepository,
	) {}

	/**
	 * Authorize the request: verify the session cookie, load the current user from
	 * the database and attach it to `req.user`. Roles and the linked member's state
	 * are resolved here, per request, so the token never carries authorization data.
	 */
	async loadSession(req: Request, res: Response) {
		const tokenString = req.cookies?.[this.cookieName];
		if (!tokenString) return;

		const payload = await this.verifyToken<SignedToken>(tokenString);
		if (!payload || typeof payload.userId !== "number") return;

		const user = await this.usersRepository.getSessionUser(payload.userId);

		// the token points at a user that no longer exists — drop the cookie
		if (!user) {
			this.clearToken(res);
			return;
		}

		req.token = tokenString;
		req.user = {
			userId: user.id,
			memberId: user.memberId ?? undefined,
			memberGroupId: user.member?.groupId ?? undefined,
			memberActive: user.member?.active ?? false,
			roles: user.roles ?? [],
			impersonatorId: payload.impersonatorId,
		};

		await this.renewTokenIfNeeded(res, payload);
	}

	async createToken(payload: TokenPayload, options: JwtSignOptions = {}) {
		return this.jwtService.signAsync({ ...payload }, { expiresIn: `${this.tokenLifetimeDays}d`, ...options });
	}

	/**
	 * Sign an arbitrary payload as a JWT. Used for short-lived OAuth codes and
	 * access tokens, which have a different shape than the user session token.
	 */
	async signToken(payload: object, options: JwtSignOptions = {}) {
		return this.jwtService.signAsync(payload as Buffer | object, options);
	}

	/** Verify a JWT and return its payload, or undefined if invalid/expired. */
	async verifyToken<T extends object = JwtPayload>(tokenString: string): Promise<T | undefined> {
		try {
			return await this.jwtService.verifyAsync<T>(tokenString, {});
		} catch {
			return undefined;
		}
	}

	/**
	 * Issue a fresh session cookie identifying the given user. `impersonatorId` marks
	 * the session as an impersonation of that user and is what logging out returns to.
	 */
	async setToken(res: Response, userId: number, impersonatorId?: number) {
		const token = await this.createToken({ userId, impersonatorId });

		// maxAge makes the cookie survive browser restarts; without it the session ends when the browser closes
		res.cookie(this.cookieName, token, {
			sameSite: "none",
			secure: true,
			httpOnly: true,
			maxAge: this.tokenLifetimeDays * 24 * 60 * 60 * 1000,
		});
	}

	clearToken(res: Response) {
		res.clearCookie(this.cookieName);
	}

	/**
	 * Sliding session renewal: once a day, a valid token gets re-issued with a fresh
	 * expiration, so users who visit at least once per tokenLifetimeDays stay logged
	 * in indefinitely. The token only carries the user id; roles are always loaded
	 * from the database on the next request.
	 */
	private async renewTokenIfNeeded(res: Response, payload: SignedToken) {
		if (!payload.iat) return;

		const tokenAgeSeconds = Math.floor(Date.now() / 1000) - payload.iat;
		if (tokenAgeSeconds < this.tokenRenewalAgeSeconds) return;

		await this.setToken(res, payload.userId, payload.impersonatorId);
	}
}
