import {
	BadRequestException,
	Body,
	Controller,
	Get,
	Headers,
	Post,
	Query,
	Req,
	Res,
	UnauthorizedException,
} from "@nestjs/common";
import { ApiExcludeController } from "@nestjs/swagger";
import { Request, Response } from "express";
import { Config } from "src/config";
import { OauthTokenBody } from "../dto/oauth.dto";
import { OauthService } from "../services/oauth.service";

@Controller("oauth")
@ApiExcludeController()
export class OauthController {
	constructor(
		private readonly oauthService: OauthService,
		private readonly config: Config,
	) {}

	@Get("authorize")
	async authorize(@Req() req: Request, @Res() res: Response, @Query() query: Record<string, string>) {
		const { client_id, redirect_uri, response_type, state } = query;

		const client = client_id ? this.oauthService.getClient(client_id) : undefined;
		if (!client) throw new BadRequestException("Unknown client_id");
		if (!redirect_uri || !this.oauthService.isRedirectUriAllowed(client, redirect_uri)) {
			throw new BadRequestException("Invalid redirect_uri");
		}
		if (response_type !== "code") throw new BadRequestException("Unsupported response_type");

		if (!req.user) {
			return res.redirect(this.config.app.baseUrl);
		}

		const code = await this.oauthService.createAuthorizationCode(req.user.userId, client, redirect_uri);

		const url = new URL(redirect_uri);
		url.searchParams.set("code", code);
		if (state) url.searchParams.set("state", state);

		return res.redirect(url.toString());
	}

	@Post("token")
	async token(@Body() body: OauthTokenBody, @Headers("authorization") authHeader?: string) {
		if (body.grant_type !== "authorization_code") throw new BadRequestException("Unsupported grant_type");

		const basic = this.parseBasicAuth(authHeader);
		const clientId = body.client_id ?? basic?.clientId;
		const clientSecret = body.client_secret ?? basic?.clientSecret;
		if (!clientId || !clientSecret) throw new UnauthorizedException("Missing client credentials");

		const client = this.oauthService.validateClientCredentials(clientId, clientSecret);
		if (!client) throw new UnauthorizedException("Invalid client credentials");

		if (!body.redirect_uri || !this.oauthService.isRedirectUriAllowed(client, body.redirect_uri)) {
			throw new BadRequestException("Invalid redirect_uri");
		}

		const accessToken = await this.oauthService.exchangeCode(body.code, client, body.redirect_uri);
		if (!accessToken) throw new BadRequestException("Invalid authorization code");

		return {
			access_token: accessToken,
			token_type: "Bearer",
			expires_in: this.oauthService.accessTokenTtlSeconds,
		};
	}

	@Get("userinfo")
	async userinfo(@Headers("authorization") authHeader?: string, @Query("access_token") accessTokenQuery?: string) {
		const bearer = authHeader?.match(/^Bearer\s+(.+)$/i)?.[1];
		const accessToken = bearer ?? accessTokenQuery;
		if (!accessToken) throw new UnauthorizedException("Missing access token");

		const info = await this.oauthService.getUserInfo(accessToken);
		if (!info) throw new UnauthorizedException("Invalid access token");

		return info;
	}

	private parseBasicAuth(header?: string): { clientId: string; clientSecret: string } | undefined {
		const match = header?.match(/^Basic\s+(.+)$/i);
		if (!match) return undefined;

		const decoded = Buffer.from(match[1], "base64").toString("utf8");
		const separator = decoded.indexOf(":");
		if (separator < 0) return undefined;

		return {
			clientId: decodeURIComponent(decoded.slice(0, separator)),
			clientSecret: decodeURIComponent(decoded.slice(separator + 1)),
		};
	}
}
