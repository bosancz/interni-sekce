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

// Authorization codes are exchanged immediately, so a short lifetime is safe
// and limits the window in which a leaked code could be replayed.
const CODE_TTL_SECONDS = 60;
// Access tokens only need to live long enough for the client to call userinfo.
const ACCESS_TTL_SECONDS = 300;

/**
 * Minimal OAuth2 identity provider (authorization-code flow) used for SSO into
 * first-party apps such as the Wiki.js wiki. Codes and access tokens are
 * stateless signed JWTs (via {@link TokenService}); no extra storage is needed.
 */
@Injectable()
export class OauthService {
	readonly accessTokenTtlSeconds = ACCESS_TTL_SECONDS;

	constructor(
		private readonly config: Config,
		private readonly tokenService: TokenService,
		private readonly users: UsersRepository,
	) {}

	/** Registered OAuth clients (only those with a configured client id). */
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

	/** Verify an authorization code and, if valid for this client, mint an access token. */
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

	/** Resolve the user behind an access token into OAuth userinfo claims. */
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
