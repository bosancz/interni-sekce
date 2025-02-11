import { Logger } from "@nestjs/common";
import { CommandFactory } from "nest-commander";
import { CliModule } from "./cli.module";
import { StaticConfig } from "./config";

async function bootstrap() {
	const logger = new Logger("CLI");

	await CommandFactory.run(CliModule, {
		logger:
			StaticConfig.environment === "development"
				? ["log", "warn", "error", "fatal", "verbose", "debug"]
				: ["log", "warn", "error", "fatal"],
		serviceErrorHandler: (error) => {
			logger.error(error);
			console.error(error);
			process.exit(1);
		},
	});
}

bootstrap();
