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
		description: "Allow seeding on a production build (NODE_ENV=production/staging), e.g. the NEXT environment.",
	})
	parseForce(): boolean {
		return true;
	}

	async run(inputs: string[], options: SeedCommandOptions): Promise<void> {
		if (StaticConfig.production && !options.force) {
			throw new Error(
				"Refusing to seed test data on a production build. Pass --force if this really is a test environment.",
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
