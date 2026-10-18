import { createMailTemplate } from "src/models/mail/functions/create-mail-template";

export const EventAnnouncementMailTemplate = createMailTemplate<{
	sender: string;
	eventName: string;
	dates: string;
	place?: string;
	leaders?: string;
	attendeesCount: number;
	url: string;
	resent: boolean;
}>({
	filePath: __dirname + "/event-announcement.mail-template.hbs",
	subject: (params) => `${params.resent ? "Opravená ohláška" : "Ohláška"} akce ${params.eventName} (${params.dates})`,
});
