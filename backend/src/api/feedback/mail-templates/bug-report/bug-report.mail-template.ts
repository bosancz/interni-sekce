import { createMailTemplate } from "src/models/mail/functions/create-mail-template";

export const BugReportMailTemplate = createMailTemplate<{
	reporter: string;
	environment: string;
	url?: string;
	description: string;
}>({
	filePath: __dirname + "/bug-report.mail-template.hbs",
	subject: "Nahlášení chyby v Interní sekci",
});
