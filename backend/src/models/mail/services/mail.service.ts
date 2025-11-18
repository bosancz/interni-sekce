import { Injectable, Logger } from "@nestjs/common";
import { Config } from "src/config";
import { GoogleService } from "src/models/google/services/google.service";
import { MailOptions } from "../schema/mail-options";

@Injectable()
export class MailService {
	private readonly logger = new Logger(MailService.name);

	constructor(
		private google: GoogleService,
		private readonly config: Config,
	) {}

	async sendMail(options: MailOptions) {
		const messageParts = [
			`From: ${this.encodeUtf8("Bošán Interní")} <${this.config.google.impersonate}>`,
			`To: ${options.to}`,
			"Content-Type: text/html; charset=utf-8",
			"MIME-Version: 1.0",
			`Subject: ${this.encodeUtf8(options.subject)}`,
			"",
			options.body,
		];

		const message = messageParts.join("\n");

		// The body needs to be base64url encoded.
		const encodedMessage = Buffer.from(message)
			.toString("base64")
			.replace(/\+/g, "-")
			.replace(/\//g, "_")
			.replace(/=+$/, "");

		this.logger.debug(`Sending email to ${options.to}`);

		const res = await this.google.gmail.users.messages.send({
			userId: "me",
			requestBody: {
				raw: encodedMessage,
			},
		});

		return res.data;
	}

	private encodeUtf8(text: string) {
		return `=?utf-8?B?${Buffer.from(text).toString("base64")}?=`;
	}
}
