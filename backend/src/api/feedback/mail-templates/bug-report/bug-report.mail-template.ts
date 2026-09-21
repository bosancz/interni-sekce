import { createMailTemplate } from "src/models/mail/functions/create-mail-template";

export const BugReportMailTemplate = createMailTemplate<{
	reporter: string;
	reporterUrl: string;
	url?: string;
	description: string;
	frontendVersion?: string;
	backendVersion?: string;
	system?: string;
	browser?: string;
	screen?: string;
	viewport?: string;
	display?: string;
	pointer?: string;
	issueNumber?: number;
	issueUrl?: string;
}>({
	filePath: __dirname + "/bug-report.mail-template.hbs",
	subject: "Nahlášení chyby v aplikaci Bošán",
});
