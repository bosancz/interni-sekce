import { Injectable } from "@nestjs/common";
import { JwtService, JwtSignOptions } from "@nestjs/jwt";
import { validateSync } from "class-validator";
import { Request, Response } from "express";
import { JwtPayload } from "jsonwebtoken";
import { User } from "src/models/users/entities/user.entity";
import { UsersRepository } from "src/models/users/repositories/users.repository";
import { TokenData, UserData } from "../schema/user-token";

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

	async parseToken(req: Request) {
		const tokenString = req.cookies?.[this.cookieName];
		if (!tokenString) return;

		try {
			const tokenData = await this.jwtService.verifyAsync<JwtPayload>(tokenString, {});

			if (this.validateToken(tokenData)) {
				req.token = tokenString;
				req.user = tokenData;
			}
		} catch (err) {}
	}

	getToken(req: Request) {
		return req["user"];
	}

	/**
	 * Build the session payload from a user. The `member` relation must be loaded
	 * so that the leader role can be gated on the linked member being active.
	 */
	buildUserData(user: User): UserData {
		return {
			userId: user.id,
			memberId: user.memberId ?? undefined,
			memberActive: user.member?.active ?? false,
			roles: user.roles ?? [],
		};
	}

	async createToken(userData: UserData, options: JwtSignOptions = {}) {
		return this.jwtService.signAsync(userData, { expiresIn: `${this.tokenLifetimeDays}d`, ...options });
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

	async setToken(res: Response, userData: UserData) {
		const token = await this.createToken(userData);

		// maxAge makes the cookie survive browser restarts; without it the session ends when the browser closes
		res.cookie(this.cookieName, token, {
			sameSite: "none",
			secure: true,
			httpOnly: true,
			maxAge: this.tokenLifetimeDays * 24 * 60 * 60 * 1000,
		});
	}

	/**
	 * Sliding session renewal: once a day, a valid token gets re-issued with a fresh
	 * expiration, so users who visit at least once per tokenLifetimeDays stay logged
	 * in indefinitely. User data is reloaded from the database so that role changes
	 * propagate and deleted accounts cannot keep extending their session.
	 */
	async renewTokenIfNeeded(req: Request, res: Response) {
		const tokenData = req.user;
		if (!tokenData?.iat) return;

		const tokenAgeSeconds = Math.floor(Date.now() / 1000) - tokenData.iat;
		if (tokenAgeSeconds < this.tokenRenewalAgeSeconds) return;

		const user = await this.usersRepository.getUser(tokenData.userId, { includeMember: true });

		if (!user) {
			this.clearToken(res);
			return;
		}

		await this.setToken(res, this.buildUserData(user));
	}

	clearToken(res: Response) {
		res.clearCookie(this.cookieName);
	}

	private validateToken(tokenData: JwtPayload): tokenData is TokenData {
		let validateData = Object.assign(new UserData(), tokenData);

		const validateErrors = validateSync(validateData, { stopAtFirstError: true });

		return validateErrors.length === 0;
	}
}
