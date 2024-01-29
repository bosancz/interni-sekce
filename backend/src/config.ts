import { Logger, LogLevel } from "@nestjs/common";
import { CorsOptions } from "@nestjs/common/interfaces/external/cors-options.interface";
import { config } from "dotenv";
import { readFileSync } from "fs";
import * as path from "path";
import { DataSourceOptions } from "typeorm";
import { SnakeNamingStrategy } from "typeorm-naming-strategies";

config({ override: true });

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
  host: process.env.HOST || production ? "0.0.0.0" : "localhost",
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : production ? 80 : 3000,
  basePath: process.env.BASE_PATH || "",
  staticRoot: process.env.STATIC_ROOT || path.join(__dirname, "../../frontend/dist"),
};

const logging: { level?: LogLevel[] } = {
  level: production ? ["log", "error", "warn"] : undefined,
};

const cors: { enable: boolean; options: CorsOptions } = {
  enable: !production,
  options: { credentials: true, origin: true },
};

/**
 * App
 */
const app = {
  name: "Bošán - Interní sekce",
  baseUrl: process.env["BASE_URL"] || `http://${server.host}${server.port ? ":" + server.port : ""}${server.basePath}`,
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

const db: DataSourceOptions = {
  type: "postgres",
  host: process.env["DB_HOST"] ?? "localhost",
  port: process.env["DB_HOST"] ? parseInt(process.env["DB_HOST"]) : 5432,
  username: process.env["DB_USER"] ?? "postgres",
  password: process.env["DB_PASSWORD"],
  schema: process.env["DB_SCHEMA"] ?? "public",
  entities: ["dist/**/*.entity.js"],
  migrationsRun: production ? true : false,
  migrations: ["dist/migrations/*.js"],
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
  impersonate: process.env["GOOGLE_IMPERSONATE"],
  clientId: process.env["GOOGLE_CLIENT_ID"],
  clientSecret: process.env["GOOGLE_CLIENT_SECRET"],
};

export const Config = {
  app,
  cors,
  db,
  environment,
  google,
  jwt,
  logging,
  mongoDb,
  production,
  server,
  fs,
};
