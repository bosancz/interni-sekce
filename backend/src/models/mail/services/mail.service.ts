import { Injectable } from "@nestjs/common";
import { GoogleService } from "src/models/google/services/google.service";
import { MailOptions } from "../schema/mail-options";

@Injectable()
export class MailService {
  constructor(private google: GoogleService) {}

  async sendMail(options: MailOptions) {
    const utf8Subject = `=?utf-8?B?${Buffer.from(options.subject).toString("base64")}?=`;

    const messageParts = [
      "From: Justin Beckwith <beckwith@google.com>",
      "To: Justin Beckwith <beckwith@google.com>",
      "Content-Type: text/html; charset=utf-8",
      "MIME-Version: 1.0",
      `Subject: ${utf8Subject}`,
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

    const res = await this.google.gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: encodedMessage,
      },
    });

    return res.data;
  }
}
