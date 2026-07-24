import { Injectable, Logger } from "@nestjs/common";
import { google } from "googleapis";
import { Config } from "src/config";

@Injectable()
export class GoogleService {
	private readonly logger = new Logger(GoogleService.name);

	readonly gmail = google.gmail({ version: "v1" });

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

	/**
	 * Validate the Google OAuth access token the frontend obtained and return the signed-in
	 * user's email.
	 *
	 * This only talks to Google's public tokeninfo endpoint, so it needs no client secret and
	 * no code exchange — the single service-account key file (used for mail) is enough for the
	 * whole Google setup, matching the old server.
	 */
	async validateAccessToken(accessToken: string): Promise<{ email: string }> {
		const client = new google.auth.OAuth2();

		// Throws on an invalid/expired token.
		const info = await client.getTokenInfo(accessToken);

		if (!info.email) throw new Error("Google account did not expose an email address");

		// When a login client id is known, make sure the token was actually minted for this
		// app — otherwise an access token obtained for a different site could be replayed here.
		if (this.config.google.clientId && info.aud !== this.config.google.clientId) {
			throw new Error("Google token was not issued for this application");
		}

		return { email: info.email };
	}
}
