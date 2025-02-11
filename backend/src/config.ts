import { Global, Injectable, Module } from "@nestjs/common";
import { config } from "dotenv";
import { readFileSync } from "fs";
import path from "path";
import { SnakeNamingStrategy } from "typeorm-naming-strategies";
import { PostgresConnectionOptions } from "typeorm/driver/postgres/PostgresConnectionOptions";

config({ override: true, debug: true });

@Injectable()
export class Config {
	packageJson = JSON.parse(readFileSync("./package.json", "utf-8"));
	environment = process.env.NODE_ENV || "development";
	logging = {
		debug: process.env.LOG_DEBUG === "true" || process.env.LOG_DEBUG === "1",
	};

	server = {
		port: process.env["PORT"] ? parseInt(process.env["PORT"]) : 3000,
		host: process.env["HOST"] || "127.0.0.1",
		cors: this.environment === "development",
		globalPrefix: process.env.GLOBAL_PREFIX ?? "api",
		baseUrl: process.env.BASE_URL || `http://${process.env.HOST || "localhost"}:${process.env.PORT ?? 3000}`,
	};

	app = {
		name: this.packageJson.name,
		version: this.packageJson.version,
		baseUrl: this.getBaseUrl(),
	};

	db: PostgresConnectionOptions = {
		type: "postgres",
		schema: "public",
		host: process.env["DB_HOST"] || "localhost",
		port: process.env["DB_PORT"] ? Number(process.env["DB_PORT"]) : 5432,
		username: process.env["DB_USER"] || "postgres",
		password: process.env["DB_PASSWORD"] || "password",
		database: process.env["DB_DATABASE"] || "postgres",
		entities: [path.join(__dirname, "**/*.entity.{js,ts}")],
		migrationsRun: false,
		migrations: [path.join(__dirname, "database/migrations/**/*{.ts,.js}")],
		namingStrategy: new SnakeNamingStrategy(),
		logging: this.logging.debug,
	};

	private getBaseUrl() {
		if (process.env.BASE_URL) return process.env.BASE_URL;

		let url = `${this.server.port === 443 ? "https" : "http"}://${this.server.host}`;

		if (this.server.port !== 80 && this.server.port !== 443) url += `:${this.server.port}`;

		return url;
	}
}

@Global()
@Module({ providers: [Config], exports: [Config] })
export class ConfigModule {}

export const StaticConfig = new Config();
