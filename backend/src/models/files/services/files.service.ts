import { Injectable, OnApplicationBootstrap } from "@nestjs/common";
import { access, mkdir, readdir, rename, rmdir, unlink, writeFile } from "fs/promises";
import { dirname, join } from "path";
import { Config } from "src/config";

function isEnoent(err: unknown): boolean {
	return typeof err === "object" && err !== null && (err as NodeJS.ErrnoException).code === "ENOENT";
}

function ignoreEnoent<T>(fallback: T) {
	return (err: unknown): T => {
		if (isEnoent(err)) return fallback;
		throw err;
	};
}

@Injectable()
export class FilesService implements OnApplicationBootstrap {
	constructor(private readonly config: Config) {}

	async onApplicationBootstrap() {
		await mkdir(this.config.fs.dataDir, { recursive: true });
		await mkdir(this.config.fs.membersDir, { recursive: true });
		await mkdir(this.config.fs.eventsDir, { recursive: true });
		await mkdir(this.config.fs.photosDir, { recursive: true });
		await mkdir(this.config.fs.thumbnailsDir, { recursive: true });
	}

	async ensureDir(path: string) {
		return mkdir(path, { recursive: true });
	}

	async fileAccessible(path: string, mode?: number) {
		return access(path, mode);
	}

	async saveFile(path: string, data: string | Buffer) {
		await mkdir(dirname(path), { recursive: true });
		return writeFile(path, data);
	}

	async deleteFile(path: string) {
		return unlink(path);
	}

	async readDir(path: string): Promise<string[]> {
		return readdir(path);
	}

	async deleteDir(path: string) {
		return rmdir(path);
	}

	async moveFile(oldPath: string, newPath: string) {
		await this.ensureDir(dirname(newPath));
		return rename(oldPath, newPath);
	}

	async deleteFilesByPrefix(directoryPath: string, prefix: string): Promise<void> {
		const files = await readdir(directoryPath).catch(ignoreEnoent<string[]>([]));
		const matchingFiles = files.filter((file) => file.startsWith(prefix));

		await Promise.all(
			matchingFiles.map((file) => unlink(join(directoryPath, file)).catch(ignoreEnoent<void>(undefined))),
		);
	}

	async getFilesByPrefx(directoryPath: string, prefix: string): Promise<string[]> {
		const files = await readdir(directoryPath);
		const matchingFiles = files.filter((file) => file.startsWith(prefix));
		return matchingFiles;
	}
}
