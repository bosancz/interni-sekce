import { createMailTemplate } from "src/models/mail/functions/create-mail-template";

export const SendLoginLinkMailTemplate = createMailTemplate<{ link: string }>({
	filePath: __dirname + "/send-login-link.mail-template.hbs",
	subject: "Přihlašovací odkaz do Interní sekce",
});
