import { Config } from "src/config";
import { GoogleService } from "src/models/google/services/google.service";
import { MailService } from "./mail.service";

function createService() {
	const send = jest.fn().mockResolvedValue({ data: {} });
	const google = { gmail: { users: { messages: { send } } } } as unknown as GoogleService;
	const config = { google: { impersonate: "interni@bosan.cz" } } as Config;

	const raw = () => Buffer.from(send.mock.calls[0][0].requestBody.raw, "base64url").toString();

	return { service: new MailService(google, config), raw };
}

describe("MailService", () => {
	it("sends a plain HTML message without attachments", async () => {
		const { service, raw } = createService();

		await service.sendMail({ to: "lef@bosan.cz", subject: "Ahoj", body: "<p>Ahoj</p>" });

		expect(raw()).toContain("Content-Type: text/html; charset=utf-8");
		expect(raw()).not.toContain("multipart");
		expect(raw().endsWith("<p>Ahoj</p>")).toBe(true);
	});

	it("wraps attachments into a multipart message", async () => {
		const { service, raw } = createService();
		const content = Buffer.from("x".repeat(200));

		await service.sendMail({
			to: "lef@bosan.cz",
			subject: "Ohláška",
			body: "<p>Ahoj</p>",
			replyTo: "gandalf@bosan.cz",
			attachments: [{ filename: "Ohlaska_Dýchánek.xlsx", contentType: "application/xlsx", content }],
		});

		const message = raw();
		const boundary = message.match(/boundary="([^"]+)"/)![1];

		expect(message).toContain("Reply-To: gandalf@bosan.cz");
		expect(message.split(`--${boundary}\n`)).toHaveLength(3);
		expect(message.trimEnd().endsWith(`--${boundary}--`)).toBe(true);
		expect(message).toContain("Content-Disposition: attachment;");

		const encoded = message.split("Content-Transfer-Encoding: base64\n\n")[1].split(`\n--${boundary}--`)[0];
		expect(encoded.split("\n").every((line) => line.length <= 76)).toBe(true);
		expect(Buffer.from(encoded.replace(/\n/g, ""), "base64").equals(content)).toBe(true);
	});
});
