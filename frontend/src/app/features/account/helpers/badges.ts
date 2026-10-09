import { SDK } from "src/sdk";

export type BadgeTone = "bronze" | "silver" | "gold" | "green" | "red" | "locked";

const TONES: BadgeTone[] = ["bronze", "silver", "gold", "green", "red"];

const NUMERALS = ["I", "II", "III", "IV", "V", "VI"];

export function getBadgeTone(level: number, levels: number): BadgeTone {
	const tones = TONES.slice(Math.max(0, 3 - levels));
	return tones[Math.min(level, tones.length) - 1] ?? "gold";
}

export function getLevelNumeral(level: number): string {
	return NUMERALS[level - 1] ?? String(level);
}

export function getBadgeLevelTitle(badge: SDK.BadgeResponse, level: number): string {
	return badge.levels.length > 1 ? `${badge.title} ${getLevelNumeral(level)}` : badge.title;
}

export interface UnseenBadge {
	badge: SDK.BadgeResponse;
	level: SDK.BadgeLevelResponse;
}

export function getUnseenBadges(badges: SDK.BadgeResponse[]): UnseenBadge[] {
	return badges
		.flatMap((badge) => {
			const unseen = badge.levels.filter((level) => level.earnedAt && !level.seenAt);
			return unseen.length ? [{ badge, level: unseen[unseen.length - 1] }] : [];
		})
		.sort((a, b) => (a.level.earnedAt ?? "").localeCompare(b.level.earnedAt ?? ""));
}

export function getNextLevel(badge: SDK.BadgeResponse): SDK.BadgeLevelResponse | undefined {
	return badge.levels.find((level) => !level.earnedAt);
}
