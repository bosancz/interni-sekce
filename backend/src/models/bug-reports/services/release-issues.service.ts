import { Injectable, Logger } from "@nestjs/common";
import { readFile } from "fs/promises";
import { Config } from "src/config";

export interface ReleaseIssue {
	number: number;
	version: string;
	text: string;
}

export interface ReleaseIssues {
	version: string;
	date: string;
	repo: string;
	issues: ReleaseIssue[];
}

@Injectable()
export class ReleaseIssuesService {
	private readonly logger = new Logger(ReleaseIssuesService.name);

	private release?: Promise<ReleaseIssues | null>;

	constructor(private config: Config) {}

	getRelease(): Promise<ReleaseIssues | null> {
		return (this.release ??= this.readReleaseIssues());
	}

	async getReleasedIssues(repo: string): Promise<Map<number, ReleaseIssue>> {
		const release = await this.getRelease();
		if (!release || release.repo !== repo) return new Map();

		return new Map(release.issues.map((issue) => [issue.number, issue]));
	}

	private async readReleaseIssues(): Promise<ReleaseIssues | null> {
		try {
			return JSON.parse(await readFile(this.config.app.releaseIssuesPath, "utf-8")) as ReleaseIssues;
		} catch (err) {
			if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;

			this.logger.error(`Failed to read ${this.config.app.releaseIssuesPath}: ${(err as Error).message}`);
			return null;
		}
	}
}
