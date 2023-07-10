import { readFileSync } from "fs";
import { compile } from "handlebars";
import { MailOptions } from "../schema/mail-options";

interface MailTemplateOptions<T> {
  filePath: string;
  subject: string | ((params: T) => string);
}

export function createMailTemplate<T>(options: MailTemplateOptions<T>) {
  const templateCode = readFileSync(options.filePath).toString();
  const template = compile(templateCode);

  return function (to: string, params: T): MailOptions {
    const body = template(params);

    const subject = typeof options.subject === "function" ? options.subject(params) : options.subject;

    return {
      body,
      subject,
      to,
    };
  };
}
