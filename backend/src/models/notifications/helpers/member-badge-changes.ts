import { NotificationMessage } from "../schema/notification-types";

export type MemberBadgeChangeKind = "added" | "removed" | "updated";

export type MemberBadgeCategory = "achievement" | "training";

export interface MemberBadgeChange {
	key: string;
	category: MemberBadgeCategory;
	title: string;
	kind: MemberBadgeChangeKind;
}

function mergeKinds(previous: MemberBadgeChangeKind, next: MemberBadgeChangeKind): MemberBadgeChangeKind | null {
	if (previous === "added" && next === "removed") return null;
	if (previous === "removed" && next === "added") return null;
	if (previous === "added") return "added";
	return next;
}

export function mergeMemberBadgeChange(changes: MemberBadgeChange[], change: MemberBadgeChange) {
	const index = changes.findIndex((item) => item.key === change.key);
	if (index === -1) return [...changes, change];

	const kind = mergeKinds(changes[index].kind, change.kind);
	if (!kind) return changes.filter((_, i) => i !== index);

	return changes.map((item, i) => (i === index ? { ...change, kind } : item));
}

const SINGLE_TITLES: Record<MemberBadgeCategory, Record<MemberBadgeChangeKind, string>> = {
	achievement: { added: "Nové ocenění", removed: "Odebrané ocenění", updated: "Upravené ocenění" },
	training: { added: "Nové školení", removed: "Odebrané školení", updated: "Upravené školení" },
};

const KIND_LABELS: Record<MemberBadgeChangeKind, string> = {
	added: "Přidáno",
	updated: "Upraveno",
	removed: "Odebráno",
};

export function getMemberBadgesMessage(
	changes: MemberBadgeChange[],
	path: string,
): Pick<NotificationMessage, "title" | "body" | "path"> | null {
	if (!changes.length) return null;

	if (changes.length === 1) {
		const [change] = changes;
		return { title: `${SINGLE_TITLES[change.category][change.kind]}: ${change.title}`, path };
	}

	const categories = new Set(changes.map((change) => change.category));
	const subject = categories.size > 1 ? "ocenění a školení" : categories.has("achievement") ? "ocenění" : "školení";

	const body = (["added", "updated", "removed"] as const)
		.map((kind) => {
			const titles = changes.filter((change) => change.kind === kind).map((change) => change.title);
			return titles.length ? `${KIND_LABELS[kind]}: ${titles.join(", ")}` : null;
		})
		.filter(Boolean)
		.join(". ");

	return { title: `Změna ${subject} na tvém profilu`, body: `${body}.`, path };
}
