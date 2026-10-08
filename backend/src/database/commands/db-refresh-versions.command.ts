import { Logger } from "@nestjs/common";
import { Command, CommandRunner } from "nest-commander";
import { Config } from "src/config";
import { refreshDatabaseVersions } from "../refresh-database-versions";

@Command({
	name: "db-refresh-versions",
	description: "Reindex after a collation version change and update extensions to the installed versions",
})
export class DbRefreshVersionsCommand extends CommandRunner {
	private logger = new Logger(DbRefreshVersionsCommand.name);

	constructor(private config: Config) {
		super();
	}

	async run(): Promise<void> {
		const result = await refreshDatabaseVersions(this.config);
		if (!result.reindexed && !result.extensions.length)
			this.logger.log("Collations and extensions are up to date.");
	}
}
