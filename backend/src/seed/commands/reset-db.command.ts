import { Logger } from "@nestjs/common";
import { Command, CommandRunner, Option } from "nest-commander";
import { Config } from "src/config";
import { runMigrations } from "src/database/run-migrations";
import { DataSource } from "typeorm";
import { SeedService } from "../services/seed.service";

interface ResetDbCommandOptions {
	force?: boolean;
	seed?: boolean;
}

@Command({
	name: "reset-db",
	arguments: "",
	options: {},
})
export class ResetDbCommand extends CommandRunner {
	private logger = new Logger(ResetDbCommand.name);

	constructor(
		private dataSource: DataSource,
		private seedService: SeedService,
		private config: Config,
	) {
		super();
	}

	@Option({
		flags: "-f, --force",
		description: "Reset even when the database is not marked as a test database.",
	})
	parseForce(): boolean {
		return true;
	}

	@Option({
		flags: "--no-seed",
		description: "Only drop the schema and run the migrations, without seeding test data.",
	})
	parseNoSeed(): boolean {
		return false;
	}

	async run(inputs: string[], options: ResetDbCommandOptions): Promise<void> {
		const database = await this.seedService.assertTestDatabase("drop and recreate the schema", options.force);

		const schema = ("schema" in this.config.db ? this.config.db.schema : null) ?? "public";

		this.logger.warn(`Dropping schema "${schema}" in database '${database}' with all its data...`);

		await this.dataSource.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
		await this.dataSource.query(`CREATE SCHEMA "${schema}"`);

		await runMigrations(this.config);

		if (options.seed !== false) await this.seedService.seed();
	}
}
