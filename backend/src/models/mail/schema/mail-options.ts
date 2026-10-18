export interface MailAttachment {
	filename: string;
	contentType: string;
	content: Buffer;
}

export interface MailOptions {
	to: string;
	subject: string;
	body: string;
	replyTo?: string;
	attachments?: MailAttachment[];
}
