import { Injectable, Logger } from "@nestjs/common";
import { existsSync, readFileSync } from "fs";
import { Config } from "src/config";

/**
 * Loads the repo-root CHANGELOG.md once at startup (it only changes on redeploy) and hands the
 * raw markdown to the changelog endpoint. Never throws: a missing/unreadable file yields "".
 */
@Injectable()
export class ChangelogService {
	private readonly logger = new Logger(ChangelogService.name);
	private readonly content: string;

	constructor(private readonly config: Config) {
		this.content = this.load();
	}

	getContent(): string {
		return this.content;
	}

	private load(): string {
		const filePath = this.config.app.changelogPath;
		try {
			if (existsSync(filePath)) return readFileSync(filePath, "utf8");
			this.logger.warn(`Changelog file not found at ${filePath}`);
		} catch (err) {
			this.logger.error(`Failed to read changelog at ${filePath}`, err as Error);
		}
		return "";
	}
}
