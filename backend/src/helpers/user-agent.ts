export interface UserAgentInfo {
	browser: string | null;
	system: string | null;
}

const BROWSER_PATTERNS: [RegExp, string][] = [
	[/(?:Edg|Edge|EdgA|EdgiOS)\/([\d.]+)/, "Microsoft Edge"],
	[/(?:OPR|Opera)\/([\d.]+)/, "Opera"],
	[/Vivaldi\/([\d.]+)/, "Vivaldi"],
	[/Brave\/([\d.]+)/, "Brave"],
	[/SamsungBrowser\/([\d.]+)/, "Samsung Internet"],
	[/YaBrowser\/([\d.]+)/, "Yandex"],
	[/(?:Firefox|FxiOS)\/([\d.]+)/, "Firefox"],
	[/(?:Chrome|CriOS)\/([\d.]+)/, "Chrome"],
	[/Version\/([\d.]+) (?:Mobile\/\S+ )?Safari\//, "Safari"],
];

const SYSTEM_PATTERNS: [RegExp, (match: RegExpMatchArray) => string][] = [
	[/Windows NT ([\d.]+)/, (match) => windowsName(match[1]!)],
	[/Android ([\d.]+)/, (match) => `Android ${major(match[1]!)}`],
	[/(iPhone|iPod).*? OS ([\d_]+)/, (match) => `iOS ${version(match[2]!)}`],
	[/iPad.*? OS ([\d_]+)/, (match) => `iPadOS ${version(match[1]!)}`],
	[/CrOS \S+ ([\d.]+)/, () => "ChromeOS"],
	[/Mac OS X ([\d._]+)/, (match) => `macOS ${version(match[1]!)}`],
	[/Macintosh/, () => "macOS"],
	[/(Ubuntu|Fedora|Debian)/i, (match) => capitalize(match[1]!)],
	[/Linux/, () => "Linux"],
];

export function parseUserAgent(userAgent: string | undefined | null): UserAgentInfo {
	if (!userAgent) return { browser: null, system: null };

	return { browser: parseBrowser(userAgent), system: parseSystem(userAgent) };
}

function parseBrowser(userAgent: string): string | null {
	for (const [pattern, name] of BROWSER_PATTERNS) {
		const match = userAgent.match(pattern);
		if (match) return [name, match[1] && major(match[1])].filter(Boolean).join(" ");
	}

	return null;
}

function parseSystem(userAgent: string): string | null {
	for (const [pattern, format] of SYSTEM_PATTERNS) {
		const match = userAgent.match(pattern);
		if (match) return format(match);
	}

	return null;
}

function windowsName(ntVersion: string): string {
	const names: Record<string, string> = {
		"10.0": "Windows 10/11",
		"6.3": "Windows 8.1",
		"6.2": "Windows 8",
		"6.1": "Windows 7",
	};

	return names[ntVersion] ?? `Windows NT ${ntVersion}`;
}

function version(value: string): string {
	return value.replace(/_/g, ".").split(".").slice(0, 2).join(".");
}

function major(value: string): string {
	return value.split(".")[0]!;
}

function capitalize(value: string): string {
	return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}
