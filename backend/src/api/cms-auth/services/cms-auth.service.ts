import { Injectable, Logger } from "@nestjs/common";
import { randomBytes } from "crypto";
import { Config } from "src/config";

export type CmsAuthResult = { token: string } | { error: string; errorCode: string };

const GITHUB_SCOPE = "repo,user";

@Injectable()
export class CmsAuthService {
	private readonly logger = new Logger(CmsAuthService.name);

	constructor(private readonly config: Config) {}

	get configured() {
		return Boolean(this.config.cmsAuth.githubClientId && this.config.cmsAuth.githubClientSecret);
	}

	isDomainAllowed(domain: string | undefined) {
		return !!domain && this.config.cmsAuth.allowedDomains.includes(domain.toLowerCase());
	}

	isOriginAllowed(origin: string) {
		try {
			return this.isDomainAllowed(new URL(origin).hostname);
		} catch {
			return false;
		}
	}

	createState() {
		return randomBytes(16).toString("hex");
	}

	getAuthorizeUrl(state: string) {
		const params = new URLSearchParams({
			client_id: this.config.cmsAuth.githubClientId,
			scope: GITHUB_SCOPE,
			state,
		});
		return `https://github.com/login/oauth/authorize?${params.toString()}`;
	}

	async exchangeCode(code: string): Promise<CmsAuthResult> {
		try {
			const response = await fetch("https://github.com/login/oauth/access_token", {
				method: "POST",
				headers: { Accept: "application/json", "Content-Type": "application/json" },
				body: JSON.stringify({
					client_id: this.config.cmsAuth.githubClientId,
					client_secret: this.config.cmsAuth.githubClientSecret,
					code,
				}),
			});
			const body = (await response.json()) as { access_token?: string; error?: string };
			if (body.access_token) return { token: body.access_token };
			this.logger.warn(`GitHub token exchange failed: ${body.error ?? response.status}`);
		} catch (err) {
			this.logger.error("GitHub token exchange failed", err instanceof Error ? err.stack : String(err));
		}
		return { error: "Nepodařilo se získat token z GitHubu. Zkus to znovu.", errorCode: "TOKEN_REQUEST_FAILED" };
	}

	renderResult(result: CmsAuthResult) {
		const state = "token" in result ? "success" : "error";
		const content =
			"token" in result ? { provider: "github", token: result.token } : { provider: "github", ...result };
		const message = `authorization:github:${state}:${JSON.stringify(content)}`;
		const serialize = (value: unknown) => JSON.stringify(value).replaceAll("<", "\\u003c");

		return `<!doctype html><html><body><script>
(() => {
	const allowed = ${serialize(this.config.cmsAuth.allowedDomains)};
	const message = ${serialize(message)};
	const isAllowed = (origin) => {
		try {
			return allowed.includes(new URL(origin).hostname.toLowerCase());
		} catch {
			return false;
		}
	};
	window.addEventListener("message", ({ data, origin }) => {
		if (data !== "authorizing:github" || !isAllowed(origin)) return;
		window.opener?.postMessage(message, origin);
	});
	window.opener?.postMessage("authorizing:github", "*");
})();
</script></body></html>`;
	}
}
