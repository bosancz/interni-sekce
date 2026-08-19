import { Logger } from "@nestjs/common";
import { Command, CommandRunner, Option } from "nest-commander";
import { StaticConfig } from "src/config";
import { SeedService } from "../services/seed.service";

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
		await this.seedService.assertTestDatabase("seed test data", options.force);

		if (StaticConfig.production) {
			this.logger.warn(
				"Seeding test data on a production build, users with well-known passwords will be created.",
			);
		}

		await this.seedService.seed();
	}
}
