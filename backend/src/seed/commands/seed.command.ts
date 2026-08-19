import { Logger } from "@nestjs/common";
import { Command, CommandRunner, Option } from "nest-commander";
import { StaticConfig } from "src/config";
import { DatabaseEnvironments, markTestDatabaseSql, SeedService } from "../services/seed.service";

interface SeedCommandOptions {
	force?: boolean;
}

@Command({
	name: "seed",
	arguments: "",
	options: {},
})
export class SeedCommand extends CommandRunner {
	private logger = new Logger(SeedCommand.name);

	constructor(private seedService: SeedService) {
		super();
	}

	@Option({
		flags: "-f, --force",
		description: "Seed even when the database is not marked as a test database.",
	})
	parseForce(): boolean {
		return true;
	}

	async run(inputs: string[], options: SeedCommandOptions): Promise<void> {
		const { database, environment } = await this.seedService.getDatabaseEnvironment();

		if (environment === DatabaseEnvironments.production) {
			throw new Error(
				`Refusing to seed test data: database '${database}' is marked as production (app.environment = '${DatabaseEnvironments.production}').`,
			);
		}

		if (environment !== DatabaseEnvironments.test && !options.force) {
			throw new Error(
				[
					`Refusing to seed test data: database '${database}' is not marked as a test database (app.environment = ${environment ?? "unset"}).`,
					`Either mark it as a test database:`,
					`    ${markTestDatabaseSql(database)}`,
					`or run the command with --force to seed it anyway.`,
				].join("\n"),
			);
		}

		if (StaticConfig.production) {
			this.logger.warn(
				"Seeding test data on a production build, users with well-known passwords will be created.",
			);
		}

		await this.seedService.seed();
	}
}
