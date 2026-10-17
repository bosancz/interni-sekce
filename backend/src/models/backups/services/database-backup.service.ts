import { Injectable, Logger } from "@nestjs/common";
import { spawn } from "child_process";
import { createReadStream, createWriteStream } from "fs";
import { mkdtemp, rm, stat } from "fs/promises";
import { DateTime } from "luxon";
import { tmpdir } from "os";
import path from "path";
import { Config } from "src/config";
import { GoogleService } from "src/models/google/services/google.service";
import { getExpiredBackups } from "../helpers/backup-retention";
import archiver = require("archiver");

@Injectable()
export class DatabaseBackupService {
	private readonly logger = new Logger(DatabaseBackupService.name);

	constructor(
		private readonly config: Config,
		private readonly googleService: GoogleService,
	) {}

	async backup() {
		const { driveFolderId, timezone, filePrefix } = this.config.backup;
		if (!driveFolderId) throw new Error("BACKUP_DRIVE_FOLDER_ID is not set.");

		const name = `${filePrefix}${DateTime.now().setZone(timezone).toFormat("yyyy-MM-dd-HHmm")}`;
		const dir = await mkdtemp(path.join(tmpdir(), "db-backup-"));
		const zipPath = path.join(dir, `${name}.zip`);

		try {
			const started = Date.now();
			await this.dumpToZip(zipPath, `${name}.sql`);
			const { size } = await stat(zipPath);
			this.logger.log(`Database dumped to ${name}.zip (${formatSize(size)}) in ${Date.now() - started} ms.`);

			const file = await this.googleService.drive.files.create({
				requestBody: { name: `${name}.zip`, parents: [driveFolderId], mimeType: "application/zip" },
				media: { mimeType: "application/zip", body: createReadStream(zipPath) },
				supportsAllDrives: true,
				fields: "id",
			});
			this.logger.log(`Database backup ${name}.zip uploaded to Google Drive (file ${file.data.id}).`);
		} finally {
			await rm(dir, { recursive: true, force: true });
		}

		await this.deleteExpired();

		return { name: `${name}.zip` };
	}

	private async dumpToZip(zipPath: string, entryName: string) {
		const db = this.config.db as {
			host?: string;
			port?: number;
			username?: string;
			password?: string;
			database?: string;
		};

		const args = [
			"--host",
			db.host ?? "localhost",
			"--port",
			String(db.port ?? 5432),
			"--username",
			db.username ?? "postgres",
			"--dbname",
			db.database ?? "postgres",
			"--no-owner",
			"--no-privileges",
			...this.config.backup.excludeTableData.map((table) => `--exclude-table-data=${table}`),
		];

		const pgDump = spawn("pg_dump", args, {
			env: { ...process.env, PGPASSWORD: db.password ?? "" },
			stdio: ["ignore", "pipe", "pipe"],
		});

		let stderr = "";
		pgDump.stderr.on("data", (chunk: Buffer) => (stderr += chunk.toString()));

		const exited = new Promise<void>((resolve, reject) => {
			pgDump.on("error", reject);
			pgDump.on("close", (code) =>
				code === 0 ? resolve() : reject(new Error(`pg_dump exited with code ${code}: ${stderr.trim()}`)),
			);
		});

		const output = createWriteStream(zipPath);
		const written = new Promise<void>((resolve, reject) => {
			output.on("close", resolve);
			output.on("error", reject);
		});

		const archive = archiver("zip", { zlib: { level: 9 } });
		const archived = new Promise<void>((resolve, reject) => {
			archive.on("error", reject);
			archive.on("end", resolve);
		});
		archive.pipe(output);
		archive.append(pgDump.stdout, { name: entryName });
		void archive.finalize();

		try {
			await Promise.all([exited, archived, written]);
		} catch (err) {
			pgDump.kill();
			archive.abort();
			throw err;
		}
	}

	private async deleteExpired() {
		const { driveFolderId, filePrefix, keepDays, keepMonths, timezone } = this.config.backup;
		const drive = this.googleService.drive;

		const files: { id: string; name: string; createdTime: string }[] = [];
		let pageToken: string | undefined;
		do {
			const res = await drive.files.list({
				q: `'${driveFolderId}' in parents and trashed = false and name contains '${filePrefix}'`,
				fields: "nextPageToken, files(id, name, createdTime)",
				pageSize: 1000,
				pageToken,
				supportsAllDrives: true,
				includeItemsFromAllDrives: true,
			});
			for (const file of res.data.files ?? []) {
				if (file.id && file.name?.startsWith(filePrefix) && file.createdTime) {
					files.push({ id: file.id, name: file.name, createdTime: file.createdTime });
				}
			}
			pageToken = res.data.nextPageToken ?? undefined;
		} while (pageToken);

		const expired = getExpiredBackups(files, { now: DateTime.now().setZone(timezone), keepDays, keepMonths });

		for (const file of expired) {
			await drive.files.delete({ fileId: file.id, supportsAllDrives: true });
			this.logger.log(`Deleted expired database backup ${file.name}.`);
		}
	}
}

function formatSize(bytes: number) {
	return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
