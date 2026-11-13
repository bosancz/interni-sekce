import { DateTime } from "luxon";
import { Command, CommandRunner, Option } from "nest-commander";
import { MemberBirthdaysService } from "../services/member-birthdays.service";

@Command({
	name: "birthdays-notify",
	description: "Notify leaders about today's birthdays of leaders and children",
})
export class BirthdaysNotifyCommand extends CommandRunner {
	constructor(private memberBirthdaysService: MemberBirthdaysService) {
		super();
	}

	async run(_params: string[], options: { date?: DateTime }): Promise<void> {
		await this.memberBirthdaysService.notifyBirthdays(options.date);
	}

	@Option({ flags: "--date <date>", description: "Day to notify about (YYYY-MM-DD), today by default" })
	parseDate(value: string) {
		const date = DateTime.fromISO(value);
		if (!date.isValid) throw new Error(`Invalid date "${value}".`);
		return date;
	}
}
