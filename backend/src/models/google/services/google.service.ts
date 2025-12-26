import { Injectable, Logger } from "@nestjs/common";
import { google } from "googleapis";
import { Config } from "src/config";

@Injectable()
export class GoogleService {
	private readonly logger = new Logger(GoogleService.name);

	readonly gmail = google.gmail({ version: "v1" });

	readonly oauth = new google.auth.OAuth2({
		clientId: this.config.google.clientId,
		clientSecret: this.config.google.clientSecret,
		redirectUri: "postmessage",
	});

	constructor(private readonly config: Config) {
		const keyFilePath = this.config.google.keyFile;

		const auth = new google.auth.GoogleAuth({
			keyFile: keyFilePath,
			scopes: [
				"https://mail.google.com/", // sending email
			],
			clientOptions: {
				subject: this.config.google.impersonate,
			},
		});

		google.options({ auth });
	}

	async validateOauthToken(code: string) {
		const tokens = await this.oauth.getToken(code).then((res) => res.tokens);
		if (!tokens.id_token) throw new Error("No id_token in Google response");

		const tokenData = this.oauth
			.verifyIdToken({
				idToken: tokens.id_token,
				audience: this.config.google.clientId,
			})
			.then((res) => res.getPayload());

		return tokenData!;
	}
}
