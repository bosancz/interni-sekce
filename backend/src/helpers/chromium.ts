import { existsSync } from "fs";

export function resolveChromiumPath(): string | undefined {
	const fromEnv = process.env["PUPPETEER_EXECUTABLE_PATH"];
	if (fromEnv) return fromEnv;

	const candidates = ["/usr/bin/chromium", "/usr/bin/chromium-browser", "/usr/bin/google-chrome"];
	return candidates.find((candidate) => existsSync(candidate));
}
