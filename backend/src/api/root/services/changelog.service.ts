import { Injectable, Logger } from "@nestjs/common";
import { existsSync, readFileSync } from "fs";
import { Config } from "src/config";

@Injectable()
export class ChangelogService {
	private readonly logger = new Logger(ChangelogService.name);

	constructor(private readonly config: Config) {}

	getContent(): string {
		return this.load();
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
