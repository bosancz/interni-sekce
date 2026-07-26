import { Injectable, Logger } from "@nestjs/common";
import { createAppAuth } from "@octokit/auth-app";
import { Octokit } from "@octokit/rest";
import { readFileSync } from "fs";
import { Config } from "src/config";

/**
 * Thin wrapper around the GitHub REST API, authenticated as a GitHub App installation.
 *
 * The app's App ID + private key sign a JWT that @octokit/auth-app exchanges for a
 * short-lived installation access token (auto-refreshed), so everything created here is
 * authored by the app itself — no personal account or PAT. Currently used to file in-app
 * bug reports as issues (see FeedbackController).
 *
 * When the app is not configured (missing App ID / private key), the service stays
 * disabled: `isConfigured` is false and callers skip it, so bug reports fall back to
 * email only instead of failing.
 */
@Injectable()
export class GithubService {
	private readonly logger = new Logger(GithubService.name);

	private readonly appId: string;
	private readonly privateKey: string;

	/** Installation client, created lazily and cached after the first successful auth. */
	private installationClient: Octokit | null = null;

	constructor(private readonly config: Config) {
		this.appId = this.config.github.appId;
		this.privateKey = this.resolvePrivateKey();

		if (!this.isConfigured) {
			this.logger.warn(
				"GitHub App is not configured (GITHUB_APP_ID / GITHUB_APP_PRIVATE_KEY[_FILE] missing); " +
					"issue creation is disabled.",
			);
		}
	}

	/** Whether the GitHub App credentials are present and issue creation can be attempted. */
	get isConfigured(): boolean {
		return Boolean(this.appId && this.privateKey);
	}

	/**
	 * Create an issue in the given "owner/repo" and return its number and html url.
	 * Any label that does not yet exist in the repo is created automatically by GitHub.
	 */
	async createIssue(
		repo: string,
		params: { title: string; body: string; labels?: string[] },
	): Promise<{ number: number; url: string }> {
		const [owner, name] = repo.split("/");
		if (!owner || !name) throw new Error(`Invalid GitHub repo "${repo}" (expected "owner/repo").`);

		const client = await this.getInstallationClient(owner, name);

		const res = await client.rest.issues.create({
			owner,
			repo: name,
			title: params.title,
			body: params.body,
			labels: params.labels,
		});

		return { number: res.data.number, url: res.data.html_url };
	}

	/** Read the private key from the inline env var or the mounted key file. */
	private resolvePrivateKey(): string {
		if (this.config.github.privateKey) return this.config.github.privateKey;

		const file = this.config.github.privateKeyFile;
		if (!file) return "";

		try {
			return readFileSync(file, "utf8");
		} catch (err) {
			this.logger.error(`Failed to read GitHub App private key file "${file}": ${(err as Error).message}`);
			return "";
		}
	}

	/**
	 * Build (and cache) an Octokit client scoped to the app's installation on the repo.
	 * The installation id is taken from config when set, otherwise discovered from the repo.
	 */
	private async getInstallationClient(owner: string, repo: string): Promise<Octokit> {
		if (this.installationClient) return this.installationClient;

		if (!this.isConfigured) throw new Error("GitHub App is not configured.");

		const auth = { appId: this.appId, privateKey: this.privateKey };

		const installationId = this.config.github.installationId
			? Number(this.config.github.installationId)
			: (await new Octokit({ authStrategy: createAppAuth, auth }).rest.apps.getRepoInstallation({ owner, repo }))
					.data.id;

		this.installationClient = new Octokit({
			authStrategy: createAppAuth,
			auth: { ...auth, installationId },
		});

		return this.installationClient;
	}
}
