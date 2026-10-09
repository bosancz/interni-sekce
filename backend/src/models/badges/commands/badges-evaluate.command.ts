import { Command, CommandRunner } from "nest-commander";
import { BadgesService } from "../services/badges.service";

@Command({
	name: "badges-evaluate",
	description: "Award badges members have newly earned and notify them",
})
export class BadgesEvaluateCommand extends CommandRunner {
	constructor(private badgesService: BadgesService) {
		super();
	}

	async run(): Promise<void> {
		await this.badgesService.evaluateAll();
	}
}
