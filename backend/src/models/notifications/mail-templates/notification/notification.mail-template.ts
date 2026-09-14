import { createMailTemplate } from "src/models/mail/functions/create-mail-template";

export const NotificationMailTemplate = createMailTemplate<{
	title: string;
	body?: string;
	url?: string;
	settingsUrl: string;
}>({
	filePath: __dirname + "/notification.mail-template.hbs",
	subject: (params) => params.title,
});
