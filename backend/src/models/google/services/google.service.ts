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
	 * Reads the profile straight from Google's UserInfo endpoint with the access token as a
	 * bearer: a valid token yields the email, an invalid/expired one yields 401. No client
	 * secret and no code exchange — the single service-account key file (used for mail) is
	 * enough for the whole Google setup, matching the old server.
	 */
	async validateAccessToken(accessToken: string): Promise<{ email: string }> {
		const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
			headers: { Authorization: `Bearer ${accessToken}` },
		});

		if (!res.ok) {
			const body = await res.text().catch(() => "");
			this.logger.warn(`Google rejected the access token (HTTP ${res.status}): ${body}`);
			throw new Error(`Google rejected the access token (HTTP ${res.status})`);
		}

		const info = (await res.json()) as { email?: string; email_verified?: boolean };
		if (!info.email) throw new Error("Google account did not expose an email address");

		return { email: info.email };
	}
}
