import { Injectable } from "@nestjs/common";
import { TokenService } from "src/auth/services/token.service";
import { Config } from "src/config";
import { UsersRepository } from "src/models/users/repositories/users.repository";

export interface OauthClient {
	clientId: string;
	clientSecret: string;
	redirectUri: string;
}

interface OauthCodePayload {
	type: "oauth_code";
	sub: number;
	clientId: string;
	redirectUri: string;
}

interface OauthAccessPayload {
	type: "oauth_access";
	sub: number;
	clientId: string;
}

const CODE_TTL_SECONDS = 60;
const ACCESS_TTL_SECONDS = 300;

@Injectable()
export class OauthService {
	readonly accessTokenTtlSeconds = ACCESS_TTL_SECONDS;

	constructor(
		private readonly config: Config,
		private readonly tokenService: TokenService,
		private readonly users: UsersRepository,
	) {}

	private get clients(): OauthClient[] {
		return [this.config.oauth.wiki].filter((client) => client.clientId && client.clientSecret);
	}

	getClient(clientId: string): OauthClient | undefined {
		return this.clients.find((client) => client.clientId === clientId);
	}

	validateClientCredentials(clientId: string, clientSecret: string): OauthClient | undefined {
		const client = this.getClient(clientId);
		if (!client) return undefined;
		return client.clientSecret === clientSecret ? client : undefined;
	}

	isRedirectUriAllowed(client: OauthClient, redirectUri: string): boolean {
		return client.redirectUri === redirectUri;
	}

	async createAuthorizationCode(userId: number, client: OauthClient, redirectUri: string): Promise<string> {
		const payload: OauthCodePayload = {
			type: "oauth_code",
			sub: userId,
			clientId: client.clientId,
			redirectUri,
		};
		return this.tokenService.signToken(payload, { expiresIn: CODE_TTL_SECONDS });
	}

	async exchangeCode(code: string, client: OauthClient, redirectUri: string): Promise<string | undefined> {
		const payload = await this.tokenService.verifyToken<OauthCodePayload>(code);
		if (!payload || payload.type !== "oauth_code") return undefined;
		if (payload.clientId !== client.clientId) return undefined;
		if (payload.redirectUri !== redirectUri) return undefined;

		return this.createAccessToken(payload.sub, client);
	}

	private async createAccessToken(userId: number, client: OauthClient): Promise<string> {
		const payload: OauthAccessPayload = {
			type: "oauth_access",
			sub: userId,
			clientId: client.clientId,
		};
		return this.tokenService.signToken(payload, { expiresIn: ACCESS_TTL_SECONDS });
	}

	async getUserInfo(accessToken: string) {
		const payload = await this.tokenService.verifyToken<OauthAccessPayload>(accessToken);
		if (!payload || payload.type !== "oauth_access") return undefined;

		const user = await this.users.getUser(payload.sub, { includeMember: true });
		if (!user || !user.email) return undefined;

		const member = user.member;
		const fullName = member ? [member.firstName, member.lastName].filter(Boolean).join(" ").trim() : "";
		const name = fullName || member?.nickname || user.email;

		return {
			sub: String(user.id),
			id: String(user.id),
			email: user.email,
			name,
			displayName: name,
		};
	}
}
