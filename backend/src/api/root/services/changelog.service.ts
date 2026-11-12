import { Injectable, Logger } from "@nestjs/common";
import { readFileSync, statSync } from "fs";
import { Config } from "src/config";
import {
	ChangelogPage,
	ChangelogSection,
	ChangelogTypeCount,
	countChangelogTypes,
	filterChangelog,
	getChangelogPage,
	parseChangelog,
} from "../helpers/changelog-pages";

interface ChangelogCache {
	mtimeMs: number;
	sections: ChangelogSection[];
	types: ChangelogTypeCount[];
}

@Injectable()
export class ChangelogService {
	private readonly logger = new Logger(ChangelogService.name);

	private cache: ChangelogCache | null = null;

	constructor(private readonly config: Config) {}

	getPage(options: { offset: number; types: string[] }): ChangelogPage & { types: ChangelogTypeCount[] } {
		const { sections, types } = this.load();
		const filtered = filterChangelog(sections, new Set(options.types));
		return { ...getChangelogPage(filtered, options.offset, this.config.changelog.pageEntries), types };
	}

	private load(): ChangelogCache {
		const filePath = this.config.app.changelogPath;
		try {
			const { mtimeMs } = statSync(filePath);
			if (this.cache?.mtimeMs !== mtimeMs) {
				const sections = parseChangelog(readFileSync(filePath, "utf8"));
				this.cache = { mtimeMs, sections, types: countChangelogTypes(sections) };
			}
			return this.cache;
		} catch (err) {
			if ((err as NodeJS.ErrnoException).code === "ENOENT")
				this.logger.warn(`Changelog file not found at ${filePath}`);
			else this.logger.error(`Failed to read changelog at ${filePath}`, err as Error);
			return { mtimeMs: 0, sections: [], types: [] };
		}
	}
}
