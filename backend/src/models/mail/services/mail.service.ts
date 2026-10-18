import { randomBytes } from "crypto";
import { Injectable, Logger } from "@nestjs/common";
import { Config } from "src/config";
import { GoogleService } from "src/models/google/services/google.service";
import { MailAttachment, MailOptions } from "../schema/mail-options";

@Injectable()
export class MailService {
	private readonly logger = new Logger(MailService.name);

	constructor(
		private google: GoogleService,
		private readonly config: Config,
	) {}

	async sendMail(options: MailOptions) {
		const headers = [
			`From: ${this.encodeUtf8("Bošán")} <${this.config.google.impersonate}>`,
			`To: ${options.to}`,
			...(options.replyTo ? [`Reply-To: ${options.replyTo}`] : []),
			"MIME-Version: 1.0",
			`Subject: ${this.encodeUtf8(options.subject)}`,
		];

		const message = options.attachments?.length
			? this.multipartMessage(headers, options.body, options.attachments)
			: [...headers, "Content-Type: text/html; charset=utf-8", "", options.body].join("\n");

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

	private multipartMessage(headers: string[], body: string, attachments: MailAttachment[]) {
		const boundary = `bosan-${randomBytes(12).toString("hex")}`;

		const parts = [
			[`--${boundary}`, "Content-Type: text/html; charset=utf-8", "", body],
			...attachments.map((attachment) => [
				`--${boundary}`,
				`Content-Type: ${attachment.contentType}; name="${this.encodeUtf8(attachment.filename)}"`,
				`Content-Disposition: attachment; filename="${this.encodeUtf8(attachment.filename)}"`,
				"Content-Transfer-Encoding: base64",
				"",
				attachment.content.toString("base64").replace(/.{76}/g, "$&\n"),
			]),
		];

		return [
			...headers,
			`Content-Type: multipart/mixed; boundary="${boundary}"`,
			"",
			...parts.map((part) => part.join("\n")),
			`--${boundary}--`,
		].join("\n");
	}

	private encodeUtf8(text: string) {
		return `=?utf-8?B?${Buffer.from(text).toString("base64")}?=`;
	}
}
