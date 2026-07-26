import { Logger } from "@nestjs/common";
import { CommandFactory } from "nest-commander";
import { CliModule } from "./cli.module";
import { StaticConfig } from "./config";

async function bootstrap() {
	const logger = new Logger("CLI");

	logger.log(`${StaticConfig.app.name} CLI`);
	logger.log(`Version: ${StaticConfig.app.version}`);

	await CommandFactory.run(CliModule, {
		logger: StaticConfig.logging.level,
		serviceErrorHandler: (error) => {
			logger.error(error);
			console.error(error);
			process.exit(1);
		},
	});
}

bootstrap();
