import { Global, Injectable, Logger, Module } from "@nestjs/common";
import { config } from "dotenv";
import { readFileSync } from "fs";
import * as path from "path";
import { SnakeNamingStrategy } from "typeorm-naming-strategies";
import { PostgresConnectionOptions } from "typeorm/driver/postgres/PostgresConnectionOptions";

config({ override: true, debug: true });

const logger = new Logger("CONFIG");

/**
 * Sets environment type (production/development) for use in other configurations
 */
const environment = process.env.NODE_ENV || "development";

const production = ["production", "staging"].includes(environment);

/**
 * Sets server startup settings
 * @property host - Server listening hostname
 * @property port - Server listening port
 * @property basePath - Server base directory
 */
const server = {
	host: process.env.HOST || production ? "0.0.0.0" : "127.0.0.1",
	port: process.env.PORT ? parseInt(process.env.PORT, 10) : production ? 80 : 3000,
	basePath: process.env.BASE_PATH || "",
	staticRoot: process.env.STATIC_ROOT || path.join(__dirname, "../../frontend/dist"),
	globalPrefix: process.env.GLOBAL_PREFIX ?? "api",
	cors: environment === "development",
};

const logging = {
	debug: process.env.LOG_DEBUG === "true" || process.env.LOG_DEBUG === "1",
};

/**
 * App
 */
const app = {
	name: "Bošán - Interní sekce",
	baseUrl:
		process.env["BASE_URL"] || `http://${server.host}${server.port ? ":" + server.port : ""}${server.basePath}`,
	version: "0.0.0",
	environmentTitle: process.env["ENV_TITLE"] ?? (environment === "production" ? "" : environment.toUpperCase()),
};

try {
	app.version = JSON.parse(readFileSync(path.join(__dirname, "../../package.json")).toString()).version;
} catch (err) {
	app.version = "ERR";
	logger.error(err);
}

const jwt = {
	secret: process.env["JWT_SECRET"] ?? "secret",
};

const db: PostgresConnectionOptions = {
	type: "postgres",
	host: process.env["DB_HOST"] ?? "localhost",
	port: process.env["DB_HOST"] ? parseInt(process.env["DB_HOST"]) : 5432,
	username: process.env["DB_USER"] ?? "postgres",
	password: process.env["DB_PASSWORD"],
	database: process.env.DB_DATABASE_NAME ?? "postgres",
	schema: process.env["DB_SCHEMA"] ?? "public",
	entities: [path.join(__dirname, "**/*.entity.{js,ts}")],
	migrationsRun: production ? true : false,
	migrations: [path.join(__dirname, "database/migrations/**/*{.ts,.js}")],
	logging: logging.debug,
	namingStrategy: new SnakeNamingStrategy(),
};

const mongoDb = {
	uri: process.env["MONGODB_URI"] ?? "",
};

const dataDir = process.env["DATA_DIR"] ?? "../data";

const fs = {
	dataDir,
	keysDir: process.env["KEYS_DIR"] ?? "../keys",
	photosDir: process.env["PHOTOS_DIR"] ?? path.join(dataDir, "photos"),
	thumbnailsDir: process.env["THUMBNAILS_DIR"] ?? path.join(dataDir, "thumbnails"),
	eventsDir: process.env["EVENTS_DIR"] ?? path.join(dataDir, "events"),
	membersDir: process.env["MEMBERS_DIR"] ?? path.join(dataDir, "members"),
};

const google = {
	keyFile: path.join(fs.keysDir, process.env["GOOGLE_KEY_FILE"] ?? "google.json"),
	impersonate: process.env["GOOGLE_IMPERSONATE"] ?? "interni@bosan.cz",
	clientId: process.env["GOOGLE_CLIENT_ID"],
	clientSecret: process.env["GOOGLE_CLIENT_SECRET"],
};

@Injectable()
export class Config {
	app = app;
	db = db;
	environment = environment;
	google = google;
	jwt = jwt;
	logging = logging;
	mongoDb = mongoDb;
	production = production;
	server = server;
	fs = fs;
}

@Global()
@Module({ providers: [Config], exports: [Config] })
export class ConfigModule {}

export const StaticConfig = new Config();
