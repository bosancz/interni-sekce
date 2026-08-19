import { Global, Injectable, Logger, LogLevel, Module } from "@nestjs/common";
import { config } from "dotenv";
import * as path from "path";
import { DataSourceOptions } from "typeorm";
import { SnakeNamingStrategy } from "./database/snake-naming.strategy";

config({ override: true, debug: true });

const logger = new Logger("CONFIG");

const environment = process.env.NODE_ENV || "development";

const production = ["production", "staging"].includes(environment);

const server = {
	host: process.env.HOST || "127.0.0.1",
	port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
	basePath: process.env.BASE_PATH || "",
	staticRoot: process.env.STATIC_ROOT || path.join(__dirname, "../../frontend/dist/browser"),
	globalPrefix: process.env.GLOBAL_PREFIX ?? "api",
	cors: environment === "development",
	corsOrigins: (process.env["CORS_ORIGINS"] ?? "https://bosan.cz,https://www.bosan.cz")
		.split(",")
		.map((origin) => origin.trim())
		.filter(Boolean),
};

const logging: { level: LogLevel[]; query: boolean } = {
	level:
		process.env["LOG_LEVEL"] === "debug" || process.env["LOG_DEBUG"] === "1" || process.env["LOG_DEBUG"] === "true"
			? ["verbose", "debug", "log", "warn", "error", "fatal"]
			: process.env["LOG_LEVEL"] === "verbose"
				? ["verbose", "log", "warn", "error", "fatal"]
				: ["log", "warn", "error", "fatal"],
	query: process.env["LOG_QUERY"] === "true" || process.env["LOG_QUERY"] === "1",
};

const app = {
	name: "Bošán",
	baseUrl:
		process.env["BASE_URL"] || `http://${server.host}${server.port ? ":" + server.port : ""}${server.basePath}`,
	version: process.env["VERSION"] || "DEV",
	environmentTitle: process.env["ENV_TITLE"] ?? (environment === "production" ? "" : environment.toUpperCase()),
	changelogPath: process.env["CHANGELOG_PATH"] || path.join(__dirname, "../../CHANGELOG.md"),
};

const jwtSecret = process.env["JWT_SECRET"];

if (production && (!jwtSecret || jwtSecret.length < 32)) {
	throw new Error("JWT_SECRET environment variable must be set to a strong (>=32 char) value in production.");
}

const jwt = {
	secret: jwtSecret ?? "secret",
};

const db: DataSourceOptions = {
	type: "postgres",
	host: process.env["DB_HOST"] ?? "localhost",
	port: process.env["DB_PORT"] ? parseInt(process.env["DB_PORT"]) : 5432,
	username: process.env["DB_USER"] ?? "postgres",
	password: process.env["DB_PASSWORD"],
	database: process.env.DB_DATABASE_NAME ?? "postgres",
	schema: process.env["DB_SCHEMA"] ?? "public",
	entities: [path.join(__dirname, "**/*.entity.{js,ts}")],
	migrationsRun: production ? true : false,
	migrations: [path.join(__dirname, "database/migrations/**/*{.ts,.js}")],
	logging: logging.query,
	namingStrategy: new SnakeNamingStrategy(),
};

const mongoDb = {
	uri: process.env["MONGODB_URI"] ?? "",
};

const dataDir = process.env["DATA_DIR"] ?? "../data";

const fs = {
	dataDir,
	keysDir: path.resolve(process.env["KEYS_DIR"] ?? "../keys"),
	photosDir: path.resolve(process.env["PHOTOS_DIR"] ?? path.join(dataDir, "photos")),
	thumbnailsDir: path.resolve(process.env["THUMBNAILS_DIR"] ?? path.join(dataDir, "thumbs")),
	eventsDir: path.resolve(process.env["EVENTS_DIR"] ?? path.join(dataDir, "events")),
	membersDir: path.resolve(process.env["MEMBERS_DIR"] ?? path.join(dataDir, "members")),
};

const photos = {
	allowedTypes: ["jpg", "jpeg", "png", "gif"],
	sizes: {
		big: { width: 1280, height: 1024 },
		small: { width: 1024, height: 340 },
	},
};

const GOOGLE_CLIENT_ID = "249555539983-j8rvff7bovgnecsmjffe0a3dj55j33hh.apps.googleusercontent.com";

const google = {
	keyFile: path.join(fs.keysDir, process.env["GOOGLE_KEY_FILE"] ?? "google.json"),
	impersonate: process.env["GOOGLE_IMPERSONATE"] ?? "interni@bosan.cz",
	clientId: process.env["GOOGLE_CLIENT_ID"] ?? GOOGLE_CLIENT_ID,
};

const mapy = {
	apiKey: process.env["MAPY_CZ_API_KEY"] ?? "",
};

const feedback = {
	bugReportRecipient: process.env["BUG_REPORT_RECIPIENT"] ?? "lef@bosan.cz",
};

const github = {
	appId: process.env["GITHUB_APP_ID"] ?? "",
	privateKey: (process.env["GITHUB_APP_PRIVATE_KEY"] ?? "").replace(/\\n/g, "\n"),
	privateKeyFile: process.env["GITHUB_APP_PRIVATE_KEY_FILE"]
		? path.resolve(fs.keysDir, process.env["GITHUB_APP_PRIVATE_KEY_FILE"])
		: "",
	installationId: process.env["GITHUB_APP_INSTALLATION_ID"] ?? "",
	bugReportRepo: process.env["GITHUB_BUG_REPORT_REPO"] ?? "bosancz/interni-sekce",
	bugReportLabel: process.env["GITHUB_BUG_REPORT_LABEL"] ?? "user-reported",
};

const ical = {
	name: process.env["ICAL_NAME"] ?? `${app.name} – program akcí`,
	description: process.env["ICAL_DESCRIPTION"] ?? "Program akcí oddílu Bošán",
	organizer: process.env["ICAL_ORGANIZER"] ?? "info@bosan.cz",
	timezone: process.env["ICAL_TIMEZONE"] ?? "Europe/Prague",
	daysBack: process.env["ICAL_DAYS_BACK"] ? parseInt(process.env["ICAL_DAYS_BACK"], 10) : 30,
	ttlSeconds: process.env["ICAL_TTL_SECONDS"] ? parseInt(process.env["ICAL_TTL_SECONDS"], 10) : 3600,
};

const oauth = {
	wiki: {
		clientId: process.env["OAUTH_WIKI_CLIENT_ID"] ?? "",
		clientSecret: process.env["OAUTH_WIKI_CLIENT_SECRET"] ?? "",
		redirectUri: process.env["OAUTH_WIKI_REDIRECT_URI"] ?? "",
	},
};

@Injectable()
export class Config {
	app = app;
	db = db;
	environment = environment;
	feedback = feedback;
	github = github;
	google = google;
	ical = ical;
	jwt = jwt;
	logging = logging;
	mongoDb = mongoDb;
	oauth = oauth;
	production = production;
	server = server;
	fs = fs;
	mapy = mapy;
	photos = photos;
}

@Global()
@Module({ providers: [Config], exports: [Config] })
export class ConfigModule {}

export const StaticConfig = new Config();
