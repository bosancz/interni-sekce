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
	healthCheckTimeoutMs: 3000,
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
	releaseIssuesPath: process.env["RELEASE_ISSUES_PATH"] || path.join(__dirname, "../../release-issues.json"),
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

const seed = {
	onStart: ["true", "1"].includes(process.env["SEED_ON_START"] ?? ""),
	password: process.env["SEED_PASSWORD"] || null,
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
	groupsDir: path.resolve(process.env["GROUPS_DIR"] ?? path.join(dataDir, "groups")),
};

const photos = {
	allowedTypes: ["jpg", "jpeg", "png", "gif"],
	sizes: {
		big: { width: 1280, height: 1024 },
		small: { width: 1024, height: 340 },
	},
	maxInputPixels: 24000 * 24000,
	faceImage: { size: 256, padding: 0.3 },
	profilePhoto: { size: 512, padding: 0.4, maxUploadSize: 20 * 1024 * 1024 },
	browseLimit: 60,
	publicPreviewCount: 8,
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

const push = {
	publicKey: process.env["VAPID_PUBLIC_KEY"] ?? "",
	privateKey: process.env["VAPID_PRIVATE_KEY"] ?? "",
	subject: process.env["VAPID_SUBJECT"] ?? `mailto:${process.env["GOOGLE_IMPERSONATE"] ?? "interni@bosan.cz"}`,
};

const notifications = {
	notifyActor: process.env["NOTIFY_ACTOR"] === "true" || process.env["NOTIFY_ACTOR"] === "1",
};

const feedback = {
	bugReportRecipient: process.env["BUG_REPORT_RECIPIENT"] ?? "lef@bosan.cz",
	issueTitleMaxLength: 80,
	issueTitleMinTextLength: 20,
};

const announcements = {
	recipient: process.env["ANNOUNCEMENT_RECIPIENT"] ?? "ohlasky@bosan.cz",
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

const redis = {
	url: process.env["REDIS_URL"] ?? "",
};

const faces = {
	cron: process.env["FACES_CRON"] ?? "0 1 * * *",
	stopCron: process.env["FACES_STOP_CRON"] ?? "0 3 * * *",
	matchCron: process.env["FACES_MATCH_CRON"] ?? "5 3 * * *",
	notifyCron: process.env["FACES_NOTIFY_CRON"] ?? "0 7 * * *",
	timezone: process.env["FACES_TIMEZONE"] ?? "Europe/Prague",
	batchSize: process.env["FACES_BATCH_SIZE"] ? parseInt(process.env["FACES_BATCH_SIZE"], 10) : 300,
	matching: {
		threshold: 0.5,
		margin: 0.05,
		minDetectionScore: 0.9,
		minAgeYears: 5,
		photosChunk: 500,
		changesDebounceMs: 2000,
		workerKeysTtlS: 3600,
		workerJobTimeoutMs: 120_000,
	},
	suggestions: {
		minScore: 0.36,
		margin: 0.1,
	},
	analysis: {
		targetPrecision: 0.95,
		minDecisions: 50,
		minWrongCandidates: 10,
		sweep: { from: 0.3, to: 0.8, step: 0.01 },
	},
	assignedOverlapIou: 0.5,
};

const backups = {
	checkCron: process.env["BACKUPS_CHECK_CRON"] ?? "0 8 * * *",
	timezone: process.env["BACKUPS_TIMEZONE"] ?? "Europe/Prague",
	maxAgeHours: process.env["BACKUPS_MAX_AGE_HOURS"] ? parseInt(process.env["BACKUPS_MAX_AGE_HOURS"], 10) : 36,
	driveFolderId: process.env["BACKUP_DRIVE_FOLDER_ID"] || null,
};

const photoContent = {
	batchSize: process.env["PHOTO_CONTENT_BATCH_SIZE"] ? parseInt(process.env["PHOTO_CONTENT_BATCH_SIZE"], 10) : 3000,
	textTimeoutMs: 30_000,
	textCacheSize: 500,
	searchLimit: 60,
	categoryPhotosLimit: 60,
	categoryPreviewLimit: 120,
	maxCategoryPhotos: 100_000,
};

const workers = {
	staleAfterMs: 25_000,
};

const statistics = {
	topLimit: 5,
	childAgeLimit: 15,
};

const insuranceCards = {
	timeoutMs: 20_000,
	timezone: "Europe/Prague",
};

const oauth = {
	wiki: {
		clientId: process.env["OAUTH_WIKI_CLIENT_ID"] ?? "",
		clientSecret: process.env["OAUTH_WIKI_CLIENT_SECRET"] ?? "",
		redirectUri: process.env["OAUTH_WIKI_REDIRECT_URI"] ?? "",
	},
	codeTtlS: 60,
	accessTtlS: 300,
};

const chronicles = {
	maxUploadSize: 50 * 1024 * 1024,
};

@Injectable()
export class Config {
	announcements = announcements;
	app = app;
	backups = backups;
	db = db;
	environment = environment;
	faces = faces;
	feedback = feedback;
	github = github;
	google = google;
	ical = ical;
	insuranceCards = insuranceCards;
	jwt = jwt;
	logging = logging;
	mongoDb = mongoDb;
	notifications = notifications;
	oauth = oauth;
	production = production;
	push = push;
	redis = redis;
	seed = seed;
	server = server;
	statistics = statistics;
	workers = workers;
	fs = fs;
	mapy = mapy;
	photoContent = photoContent;
	photos = photos;
	chronicles = chronicles;
}

@Global()
@Module({ providers: [Config], exports: [Config] })
export class ConfigModule {}

export const StaticConfig = new Config();
