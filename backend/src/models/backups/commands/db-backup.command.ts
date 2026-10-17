import { Command, CommandRunner } from "nest-commander";
import { DatabaseBackupService } from "../services/database-backup.service";

@Command({
	name: "db-backup",
	description: "Dump the database, zip it and upload it to Google Drive",
})
export class DbBackupCommand extends CommandRunner {
	constructor(private databaseBackupService: DatabaseBackupService) {
		super();
	}

	async run(): Promise<void> {
		await this.databaseBackupService.backup();
	}
}
