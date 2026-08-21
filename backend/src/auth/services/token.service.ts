import { Injectable } from "@nestjs/common";
import { JwtService, JwtSignOptions } from "@nestjs/jwt";
import { Request, Response } from "express";
import { JwtPayload } from "jsonwebtoken";
import { UsersRepository } from "src/models/users/repositories/users.repository";
import { SignedToken, TokenPayload } from "../schema/user-token";

@Injectable()
export class TokenService {
	private readonly cookieName = "token";

	private readonly tokenLifetimeDays = 90;

	private readonly tokenRenewalAgeSeconds = 24 * 60 * 60;

	constructor(
		private jwtService: JwtService,
		private usersRepository: UsersRepository,
	) {}

	async loadSession(req: Request, res: Response) {
		const tokenString = req.cookies?.[this.cookieName];
		if (!tokenString) return;

		const payload = await this.verifyToken<SignedToken>(tokenString);
		if (!payload || typeof payload.userId !== "number") return;

		const user = await this.usersRepository.getSessionUser(payload.userId);

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

	async signToken(payload: object, options: JwtSignOptions = {}) {
		return this.jwtService.signAsync(payload as Buffer | object, options);
	}

	async verifyToken<T extends object = JwtPayload>(tokenString: string): Promise<T | undefined> {
		try {
			return await this.jwtService.verifyAsync<T>(tokenString, {});
		} catch {
			return undefined;
		}
	}

	async setToken(res: Response, userId: number, impersonatorId?: number) {
		const token = await this.createToken({ userId, impersonatorId });

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

	private async renewTokenIfNeeded(res: Response, payload: SignedToken) {
		if (!payload.iat) return;

		const tokenAgeSeconds = Math.floor(Date.now() / 1000) - payload.iat;
		if (tokenAgeSeconds < this.tokenRenewalAgeSeconds) return;

		await this.setToken(res, payload.userId, payload.impersonatorId);
	}
}
