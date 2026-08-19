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
			scopes: ["https://mail.google.com/"],
			clientOptions: {
				subject: this.config.google.impersonate,
			},
		});

		google.options({ auth });
	}

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
