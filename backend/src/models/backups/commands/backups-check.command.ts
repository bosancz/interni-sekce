import { Command, CommandRunner } from "nest-commander";
import { BackupsCheckService } from "../services/backups-check.service";

@Command({
	name: "backups-check",
	description: "Notify admins when the last backups failed or are too old",
})
export class BackupsCheckCommand extends CommandRunner {
	constructor(private backupsCheckService: BackupsCheckService) {
		super();
	}

	async run(): Promise<void> {
		await this.backupsCheckService.check();
	}
}
