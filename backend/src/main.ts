import { Logger, NestApplicationOptions, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";
import { Config, StaticConfig } from "./config";
import { runMigrations } from "./database/run-migrations";
import { registerOpenAPI } from "./openapi";
import { SeedService } from "./seed/services/seed.service";

async function bootstrap() {
	const logger = new Logger("MAIN");

	logger.log("Bošán");
	logger.log(`Version: ${StaticConfig.app.version}`);
	logger.log(`Environment: ${StaticConfig.environment}`);

	if (StaticConfig.environment === "production") {
		logger.log("Spouštím migrace...");
		await runMigrations(StaticConfig);
		logger.log("Migrace dokončeny.");
	}

	const nestOptions: NestApplicationOptions = {
		rawBody: true,
		logger: StaticConfig.logging.level,
	};

	const app = await NestFactory.create<NestExpressApplication>(AppModule, nestOptions);

	const config = app.get(Config);

	if (config.seed.onStart) {
		logger.log("SEED_ON_START je zapnuté, plním databázi testovacími daty...");
		await app.get(SeedService).seedOnStart();
	}

	if (config.server.globalPrefix) {
		app.setGlobalPrefix(config.server.globalPrefix);
	}

	if (config.server.cors) {
		app.enableCors({
			origin: true,
			credentials: true,
		});
	} else if (config.server.corsOrigins.length) {
		app.enableCors({
			origin: config.server.corsOrigins,
			credentials: true,
		});
	}

	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			forbidNonWhitelisted: true,
			transform: true,
			transformOptions: { enableImplicitConversion: true },
		}),
	);

	registerOpenAPI("api/openapi", app, config);

	if (!config.production) {
		app.getHttpAdapter().getInstance().set("json spaces", 2);
	}

	app.use(cookieParser());

	await app.listen(config.server.port, config.server.host);

	logger.log(`Server running on http://${config.server.host}:${config.server.port}`);
}
bootstrap();
